const { expect } = require('chai');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const Task = require('../../src/sw/models/task');
const {
  next,
  mockKnowledgeRequestInfo,
  mockElasticSearchSameDateResult,
  searchedKnowledgeGraph
} = require('../mocks');
const {
  isKnowledgeCached,
  cacheKnowledge
} = require('../../src/middlewares/knowledge-cache');
const elasticSearch = require('../../src/utils/elasticSearch');

describe('KnowledgeCache Middleware service', function () {
  let req, res;

  beforeEach(() => {
    req = {
      ...mockKnowledgeRequestInfo.info.req,
      logger,
      get: () => {}
    };
    res = {
      header: () => {},
      status: sinon.mock().returnsThis,
      json: (value) => value,
      send: () => {}
    };
    sinon.stub(elasticSearch, 'initES').returns(true);
    sinon.stub(elasticSearch, 'searchType').returns(searchedKnowledgeGraph);
    sinon.stub(elasticSearch, 'deleteSingleDoc').resolves({ deleted: true });
    sinon.stub(elasticSearch, 'indexDocument').resolves();
    sinon.stub(Task, 'create').resolves(true);
    sinon.stub(Task, 'findOne').returns(null);
  });
  afterEach(() => sinon.restore());

  // const req = {
  //   query: { whyisPath: '' },
  //   ...mockKnowledgeRequestInfo.info.req,
  //   logger,
  //   get: () => {}
  // };

  // const res = {
  //   header: () => {},
  //   status: sinon.mock().returnsThis,
  //   json: (value) => value,
  //   send: () => {}
  // };

  context('isKnowledgeCached', () => {
    it('returns the cached knowledge', async function () {
      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('returns the cached knowledge', async function () {
      // sinon.stub(Task, 'findOne').returns(true);
      Task.findOne.returns(true);
      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('returns the cached knowledge', async function () {
      elasticSearch.searchType.returns(mockElasticSearchSameDateResult);
      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('does not find the cached knowledge and calls next', async function () {
      const nextSpy = sinon.spy();
      elasticSearch.searchType.returns({ data: { hits: { hits: [] } } });
      await isKnowledgeCached(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.equal(true);
    });
  });

  context('cacheKnowledge', () => {
    let data;

    beforeEach(() => {
      data = { results: { bindings: [] } };
    });

    it('should not cache curation submissions', async () => {
      req.query.whyisPath = 'pub';
      await cacheKnowledge(req, res, next, data);
      expect(elasticSearch.searchType.called).to.be.false;
      expect(elasticSearch.deleteSingleDoc.called).to.be.false;
      expect(elasticSearch.indexDocument.called).to.be.false;
    });

    it('should not cache nanopub listings', async () => {
      req.query.whyisPath = 'about?view=nanopublications&uri=';
      await cacheKnowledge(req, res, next, data);
      expect(elasticSearch.searchType.called).to.be.false;
      expect(elasticSearch.deleteSingleDoc.called).to.be.false;
      expect(elasticSearch.indexDocument.called).to.be.false;
    });

    it('should not cache empty query strings', async () => {
      req.query.query = '';
      await cacheKnowledge(req, res, next, data);
      expect(elasticSearch.searchType.called).to.be.false;
      expect(elasticSearch.deleteSingleDoc.called).to.be.false;
      expect(elasticSearch.indexDocument.called).to.be.false;
    });

    it('should not cache if binding is empty', async () => {
      req.query.query = 'test';

      await cacheKnowledge(req, res, next, data);
      expect(elasticSearch.searchType.called).to.be.false;
      expect(elasticSearch.deleteSingleDoc.called).to.be.false;
      expect(elasticSearch.indexDocument.called).to.be.false;
    });

    it('should delete existing document and cache new data if backend call', async () => {
      req.query.query = 'test';
      req.query.whyisPath = '';

      req.isBackendCall = true;
      data.results.bindings.push({}); // Mock non-empty bindings

      elasticSearch.searchType.resolves({
        data: { hits: { hits: [{ _id: '123' }] } }
      });

      await cacheKnowledge(req, res, next, data);

      expect(elasticSearch.searchType.called).to.be.true;

      const cacheItem = {
        label: 'test',
        response: data,
        date: new Date().toISOString().slice(0, 10)
      };

      expect(
        elasticSearch.indexDocument.calledWith(req, 'knowledge', cacheItem)
      ).to.be.true;
    });

    it('should cache new data if not backend call', async () => {
      req.query.query = 'test';
      data.results.bindings.push({}); // Mock non-empty bindings
      req.query.whyisPath = '';
      await cacheKnowledge(req, res, next, data);

      expect(elasticSearch.searchType.called).to.be.false;
      expect(elasticSearch.deleteSingleDoc.called).to.be.false;
      expect(elasticSearch.indexDocument.calledOnce).to.be.true;

      const cacheItem = {
        label: 'test',
        response: data,
        date: new Date().toISOString().slice(0, 10)
      };

      expect(
        elasticSearch.indexDocument.calledWith(req, 'knowledge', cacheItem)
      ).to.be.true;
    });
  });
});
