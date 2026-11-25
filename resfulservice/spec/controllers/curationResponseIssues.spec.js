const chai = require('chai');
const sinon = require('sinon');
const CurationController = require('../../src/controllers/curationController');
const JobsController = require('../../src/controllers/jobs');
const Builder = require('../../src/utils/curation-builder');
const CH = require('../../src/utils/curation-utility');
const elasticSearch = require('../../src/utils/elasticSearch');
const latency = require('../../src/middlewares/latencyTimer');
const { logger } = require('../common/utils');

const { expect } = chai;

// The curation API responses carry the transform's unit `issues` list,
// always present, while every other part of each body stays as it is.

const xmlIssue = (record, path) => ({
  severity: 'warning',
  code: 'UNIT_UNRESOLVED',
  message: 'Unit "zorkmid" matches no QUDT unit',
  value: 'zorkmid',
  record,
  path
});

const sddIssue = (column) => ({
  severity: 'warning',
  code: 'UNIT_UNRESOLVED',
  message: 'Unit "zorkmid" matches no QUDT unit',
  value: 'zorkmid',
  column
});

const jsonRes = () => {
  const res = {
    header: () => res,
    setHeader: () => res,
    get: () => undefined,
    status: sinon.stub(),
    json: sinon.stub()
  };
  res.status.returns(res);
  res.json.returns(res);
  return res;
};

const streamRes = () => {
  const res = jsonRes();
  res.writeHead = sinon.stub();
  res.write = sinon.stub();
  res.end = sinon.stub();
  return res;
};

const streamEvents = (res) =>
  res.write.args.map(([chunk]) =>
    JSON.parse(chunk.replace(/^data: /, '').trim())
  );

const SKELETON = {
  id: 'http://materialsmine.org/np/sdd-units',
  title: 'Units dataset',
  description: 'A dataset with units',
  doi: '10.1234/units',
  organizations: [{ name: 'Duke University' }],
  distribution: {
    'mm:hasDistribution': {
      '@id': 'http://materialsmine.org/resource/pnc/sdd-units/attr/d',
      'dcat:distribution': [
        { '@id': 'http://localhost/api/files/dict.xlsx?isStore=true' },
        { '@id': 'http://localhost/api/files/data.csv?isStore=true' }
      ]
    }
  },
  depiction: null
};

const SKELETON_PAYLOAD = {
  description: 'A dataset with units',
  identifier: 'http://materialsmine.org/np/sdd-units',
  label: 'Units dataset',
  thumbnail: '',
  doi: '10.1234/units',
  organization: ['Duke University'],
  distribution: [
    'http://localhost/api/files/dict.xlsx?isStore=true',
    'http://localhost/api/files/data.csv?isStore=true'
  ]
};

const SHACL_FAILURE = {
  id: 'sdd-units',
  sampleID: 'sdd-units',
  stage: 'shacl',
  errors: [{ message: 'shape violated' }]
};

const sddTransform = (issues, batches = 1) => ({
  nanopubId: 'sdd-units',
  nanopub: { '@graph': [] },
  assertionId: 'http://materialsmine.org/np/sdd-units#assertion',
  remainingBatches: Array.from({ length: batches - 1 }, () => []),
  totalBatches: batches,
  _batchMeta: {},
  issues
});

describe('Curation responses carry unit issues', function () {
  let indexed;

  beforeEach(() => {
    indexed = [];
    sinon.stub(latency, 'latencyCalculator').returns(true);
    sinon.stub(CurationController, 'createChangeLog').resolves({});
    sinon.stub(JobsController, 'updateStatus').resolves({});
    sinon.stub(elasticSearch, 'indexDataset').callsFake(async (req, doc) => {
      indexed.push(JSON.parse(JSON.stringify(doc)));
    });
  });

  afterEach(() => sinon.restore());

  context('XML curationETL', () => {
    it('returns one top-level issues list holding the issues of passing and SHACL-failed records', async () => {
      const issuesT1 = [xmlIssue('T1', 'MATERIALS.Matrix.MatrixComponent.Density.unit')];
      const issuesT2 = [
        xmlIssue('T2', 'MICROSTRUCTURE.LengthUnit'),
        xmlIssue('T2', 'PROCESSING.MeltMixing.ChooseParameter[2].Mixing.RPM.unit')
      ];
      const failureT2 = {
        id: 'xml-2',
        sampleID: 'T2',
        stage: 'shacl',
        errors: [{ message: 'shape violated' }]
      };
      sinon.stub(CH, 'getText').callsFake(async (src) => ({
        rawXml: src,
        id: src.includes('T1') ? 'xml-1' : 'xml-2'
      }));
      sinon.stub(Builder, 'transformXmlToNanopub').callsFake(async (parsed) => {
        const id = parsed.PolymerNanocomposite.ID;
        return {
          nanopubId: id,
          nanopub: { '@graph': [] },
          assertionId: `http://materialsmine.org/np/${id}#assertion`,
          issues: id === 'T1' ? issuesT1 : issuesT2
        };
      });
      sinon.stub(Builder, 'serializeAndValidate').callsFake(async ({ nanopubId }) =>
        nanopubId === 'T1'
          ? { success: true, result: { id: 'xml-1', sampleID: 'T1' } }
          : { success: false, failure: failureT2 }
      );
      const req = {
        logger,
        body: {
          xmls: [
            '<PolymerNanocomposite><ID>T1</ID></PolymerNanocomposite>',
            '<PolymerNanocomposite><ID>T2</ID></PolymerNanocomposite>'
          ]
        }
      };
      const res = jsonRes();
      const next = sinon.spy();

      await CurationController.curationETL(req, res, next);

      expect(next.called).to.equal(false);
      expect(res.status.calledOnceWith(200)).to.equal(true);
      const { issues, ...rest } = res.json.firstCall.args[0];
      expect(rest).to.deep.equal({
        count: 2,
        ok: false,
        processedCount: 1,
        failedCount: 1,
        processed: [{ id: 'xml-1', sampleID: 'T1' }],
        failed: [failureT2]
      });
      expect(issues).to.have.deep.members([...issuesT1, ...issuesT2]);
    });
  });

  context('SDD sddCurationETL, single batch', () => {
    it('adds issues to the 200 body but not to the indexed payload', async () => {
      const issues = [sddIssue('Temp'), sddIssue('??Calc')];
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform(issues));
      sinon.stub(Builder, 'serializeAndValidate').resolves({
        success: true,
        result: { id: 'sdd-units' }
      });
      const req = { logger, body: { nanopubSkeleton: SKELETON } };
      const res = jsonRes();
      const next = sinon.spy();

      await CurationController.sddCurationETL(req, res, next);

      expect(next.called).to.equal(false);
      expect(res.status.calledOnceWith(200)).to.equal(true);
      expect(indexed).to.deep.equal([SKELETON_PAYLOAD]);
      expect(res.json.firstCall.args[0]).to.deep.equal({
        ...SKELETON_PAYLOAD,
        issues
      });
    });

    it('adds issues to the 400 body when the batch fails SHACL', async () => {
      const issues = [sddIssue('Temp')];
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform(issues));
      sinon.stub(Builder, 'serializeAndValidate').resolves({
        success: false,
        failure: SHACL_FAILURE
      });
      const req = { logger, body: { nanopubSkeleton: SKELETON } };
      const res = jsonRes();
      const next = sinon.spy();

      await CurationController.sddCurationETL(req, res, next);

      expect(next.called).to.equal(false);
      expect(res.status.calledOnceWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0]).to.deep.equal({
        ok: false,
        failed: [SHACL_FAILURE],
        issues
      });
    });
  });

  context('SDD sddCurationETL, multi-batch event stream', () => {
    it('adds issues to the done event', async () => {
      const issues = [sddIssue('Pres')];
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform(issues, 2));
      sinon.stub(Builder, 'buildBatchNanopub').returns({ '@graph': [] });
      sinon.stub(Builder, 'serializeAndValidate').resolves({
        success: true,
        result: { id: 'sdd-units' }
      });
      const req = { logger, body: { nanopubSkeleton: SKELETON } };
      const res = streamRes();
      const next = sinon.spy();

      await CurationController.sddCurationETL(req, res, next);

      expect(next.called).to.equal(false);
      expect(res.writeHead.calledOnceWith(200)).to.equal(true);
      expect(indexed).to.deep.equal([SKELETON_PAYLOAD]);
      const events = streamEvents(res);
      expect(events.filter((e) => e.error)).to.deep.equal([]);
      const done = events.filter((e) => e.done);
      expect(done).to.have.length(1);
      expect(done[0]).to.deep.equal({
        done: true,
        ...SKELETON_PAYLOAD,
        issues
      });
    });

    it('adds issues to the error event of a batch that fails SHACL', async () => {
      const issues = [sddIssue('Temp'), sddIssue('Pres')];
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform(issues, 2));
      sinon.stub(Builder, 'buildBatchNanopub').returns({ '@graph': [] });
      sinon.stub(Builder, 'serializeAndValidate').callsFake(async ({ appendOnly }) =>
        appendOnly
          ? { success: false, failure: SHACL_FAILURE }
          : { success: true, result: { id: 'sdd-units' } }
      );
      const req = { logger, body: { nanopubSkeleton: SKELETON } };
      const res = streamRes();
      const next = sinon.spy();

      await CurationController.sddCurationETL(req, res, next);

      expect(next.called).to.equal(false);
      expect(res.end.calledOnce).to.equal(true);
      const events = streamEvents(res);
      expect(events.filter((e) => e.done)).to.deep.equal([]);
      const errors = events.filter((e) => e.error);
      expect(errors).to.have.length(1);
      expect(errors[0]).to.deep.equal({
        error: true,
        batch: 2,
        total: 2,
        failure: SHACL_FAILURE,
        issues
      });
    });
  });

  context('SDD submitDatasetToKG', () => {
    const submitReq = () => ({
      logger,
      params: { id: 'sdd-units' },
      body: {
        label: 'Units dataset',
        distribution: ['http://localhost/api/files/dict.xlsx?isStore=true']
      }
    });

    it('adds issues to the 200 body', async () => {
      const issues = [sddIssue('Temp')];
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform(issues));
      sinon.stub(Builder, 'serializeAndValidate').resolves({
        success: true,
        result: { id: 'sdd-units' }
      });
      const res = jsonRes();
      const next = sinon.spy();

      await CurationController.submitDatasetToKG(submitReq(), res, next);

      expect(next.called).to.equal(false);
      expect(res.status.calledOnceWith(200)).to.equal(true);
      expect(indexed).to.have.length(1);
      expect(indexed[0]).to.not.have.property('issues');
      expect(res.json.firstCall.args[0]).to.deep.equal({
        ok: true,
        result: { id: 'sdd-units' },
        issues
      });
    });

    it('adds an empty issues list to the 400 body when there are none', async () => {
      sinon.stub(Builder, 'transformSddToNanopub').resolves(sddTransform([]));
      sinon.stub(Builder, 'serializeAndValidate').resolves({
        success: false,
        failure: SHACL_FAILURE
      });
      const res = jsonRes();
      const next = sinon.spy();

      await CurationController.submitDatasetToKG(submitReq(), res, next);

      expect(next.called).to.equal(false);
      expect(res.status.calledOnceWith(400)).to.equal(true);
      expect(res.json.firstCall.args[0]).to.deep.equal({
        ok: false,
        failed: [SHACL_FAILURE],
        issues: []
      });
    });
  });
});
