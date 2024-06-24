const chai = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const DatasetProperty = require('../../src/models/datasetProperty');
const {
  getDatasetProperties,
  deploymentStatus,
  deploymentTags,
  generalDeployment,
  ontologyDeployment,
  deleteElasticSearchIndex
} = require('../../src/controllers/adminController');
const elasticSearch = require('../../src/utils/elasticSearch');
const {
  next,
  // mockDatasetProperties,
  fetchedDatasetProperties,
  mockDeployment
  // mockDeploymentPage2
} = require('../mocks');
const latency = require('../../src/middlewares/latencyTimer');
const { logger } = require('../common/utils');
const { expect } = chai;

describe('Admin Controllers Unit Tests:', function () {
  beforeEach(() => {
    axiosStub = sinon.stub(axios, 'request');
  });

  afterEach(() => {
    sinon.restore();
    axiosStub.restore();
  });

  this.timeout(10000);

  const req = {
    logger,
    body: {},
    user: { _id: '60d5f4b8f5f3a3e7a1bce100' },
    params: {},
    query: {}
  };

  const res = {
    status: sinon.stub().returnsThis(),
    json: (value) => value
  };

  context('getDatasetProperties', () => {
    it('should return a 400 error if no search query params', async function () {
      const result = await getDatasetProperties(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal('search query params is missing');
    });

    it.skip('should return a list of filtered dataset properties', async function () {
      req.query = { search: 'Loss' };
      sinon.stub(DatasetProperty, 'find').returns(fetchedDatasetProperties);
      const result = await getDatasetProperties(req, res, next);

      expect(result).to.have.property('data');
    });

    it('should return a 500 server error', async function () {
      req.query = { search: 'Loss tangent' };
      const nextSpy = sinon.spy();
      sinon.stub(DatasetProperty, 'find').throws();

      await getDatasetProperties(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('deploymentTags', () => {
    const tagsRequest = {
      ...req,
      env: { DOCKER_HUB_ADDRESS: 'https://hub.docker.com' }
    };

    it.skip('should return a list of tags', async function () {
      axiosStub.resolves({ status: 200, data: mockDeployment });

      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await deploymentTags(tagsRequest, res, next);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.be.a('String');
      expect(result[0]).to.equal('latest');
    });

    it('should return a 500 server error', async function () {
      axiosStub.rejects({
        request: { status: 500, data: 'No response received from the server' }
      });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await deploymentTags(tagsRequest, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('No response received from the server');
    });
  });

  const generalReq = {
    ...req,
    env: { DEPLOYMENT_ADDRESS: 'http://localhost:6600' },
    body: { version: 'latest' },
    params: { deploymentType: 'general' }
  };
  context('generalDeployment', () => {
    it('should return 200 status', async function () {
      axiosStub.resolves({ status: 200, data: { status: 'Accepted' } });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await generalDeployment(generalReq, res, next);
      expect(result).to.be.an('Object');
      expect(result).to.have.property('status');
    });

    it('should return a 500 server error', async function () {
      axiosStub.rejects({
        response: { status: 500, data: 'Internal Server Error' }
      });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await generalDeployment(generalReq, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(
        'Cannot not process this request at this time'
      );
    });
  });

  context('ontologyDeployment', () => {
    it('should return status 200', async function () {
      axiosStub.resolves({ status: 200, data: { status: 'Accepted' } });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await ontologyDeployment(generalReq, res, next);
      expect(result).to.be.an('Object');
      expect(result).to.have.property('status');
      expect(result.status).to.equal('Accepted');
    });

    it('should return a 500 server error', async function () {
      const nextSpy = sinon.spy();
      axiosStub.rejects();
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await ontologyDeployment(generalReq, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('deploymentStatus', () => {
    it('should return a 200 status', async function () {
      axiosStub.resolves({ status: 200, data: { status: 'Accepted' } });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await deploymentStatus(generalReq, res, next);
      expect(result).to.be.an('Object');
      expect(result).to.have.property('status');
      expect(result.status).to.equal('Accepted');
    });

    it('should return a 500 server error', async function () {
      const nextSpy = sinon.spy();
      axiosStub.rejects();
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await deploymentStatus(generalReq, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('deleteElasticSearchIndex', () => {
    it.skip('should delete an ElasticSearch index and return a 200 status', async function () {
      req.params.type = 'testType';
      const responseMock = { acknowledged: true };

      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(elasticSearch, 'deleteIndex').resolves(responseMock);

      await deleteElasticSearchIndex(req, res, next);

      expect(elasticSearch.deleteIndex.calledOnce).to.be.true;
      expect(elasticSearch.deleteIndex.calledWith(req, 'testType')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should handle errors and call next with errorWriter', async function () {
      req.params.type = 'testType';
      const errorMock = new Error('Test error');
      const nextSpy = sinon.spy();

      sinon.stub(elasticSearch, 'deleteIndex').throws(errorMock);

      await deleteElasticSearchIndex(req, res, nextSpy);

      expect(elasticSearch.deleteIndex.calledOnce).to.be.true;
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.calledWith(sinon.match.instanceOf(Error))).to.be.true;
    });
  });
});
