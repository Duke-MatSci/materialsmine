const { expect } = require('chai');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const Task = require('../../src/sw/models/task');
const {
  next,
  mockKnowledgeRequestInfo,
  mockElasticSearchResult,
  mockElasticSearchSameDateResult
} = require('../mocks');
const { isKnowledgeCached } = require('../../src/middlewares/knowledge-cache');
const elasticSearch = require('../../src/utils/elasticSearch');

describe('KnowledgeCache Middleware service', function () {
  afterEach(() => sinon.restore());

  const req = {
    ...mockKnowledgeRequestInfo.info.req,
    logger,
    get: () => {}
  };

  const res = {
    header: () => {},
    status: sinon.mock().returnsThis,
    json: (value) => value,
    send: () => {}
  };

  context('isKnowledgeCached', () => {
    it('returns the cached knowledge', async function () {
      sinon.stub(elasticSearch, 'initES').returns(true);
      sinon
        .stub(elasticSearch, 'searchKnowledgeGraph')
        .returns(mockElasticSearchResult);
      sinon.stub(Task, 'create').resolves(true);
      sinon.stub(Task, 'findOne').returns(null);

      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('returns the cached knowledge', async function () {
      sinon.stub(elasticSearch, 'initES').returns(true);
      sinon
        .stub(elasticSearch, 'searchKnowledgeGraph')
        .returns(mockElasticSearchResult);
      sinon.stub(Task, 'findOne').returns(true);

      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('returns the cached knowledge', async function () {
      sinon.stub(elasticSearch, 'initES').returns(true);
      sinon
        .stub(elasticSearch, 'searchKnowledgeGraph')
        .returns(mockElasticSearchSameDateResult);

      const result = await isKnowledgeCached(req, res, next);
      expect(result).to.have.property('head');
      expect(result).to.have.property('results');
    });

    it('does not find the cached knowledge and calls next', async function () {
      const nextSpy = sinon.spy();
      sinon.stub(elasticSearch, 'initES').returns(true);
      sinon.stub(elasticSearch, 'searchKnowledgeGraph').returns([]);

      await isKnowledgeCached(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.equal(true);
    });
  });
});
