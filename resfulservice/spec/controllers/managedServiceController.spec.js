const { expect } = require('chai');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const { next } = require('../mocks');
const {
  manageServiceRequest,
  chemPropsSeed,
  dbRequest
} = require('../../src/controllers/managedServiceController');
const latency = require('../../src/middlewares/latencyTimer');
const { userRoles } = require('../../config/constant');
const Polymer = require('../../src/models/polymer');
const mockDynamfitChartData = {
  multi: true,
  response: {
    'complex-chart': null,
    'complex-tand-chart': null,
    mytable: null,
    'relaxation-chart': null,
    'relaxation-spectrum-chart': null,
    'upload-data': null
  }
};

const dynafitSuccessResponse = {
  status: 200,
  headers: {
    latency: '1s',
    responseId: 'askle90lk.s409sjgl0ad.s0akng40a'
  },
  data: mockDynamfitChartData
};

const dynamfitErrorResponse = {
  status: 400,
  headers: {
    latency: '1s',
    responseId: 'askle90lk.s409sjgl0ad.s0akng40a'
  },
  data: {
    message:
      "File 'left_sloth_evie-2024-01-05T16:40:33.500Z-PMMA_shifted_R10_data.txt' not found"
  }
};

describe('Manage Service Controller Unit Tests:', function () {
  afterEach(() => sinon.restore());

  const req = {
    logger,
    body: {
      useSample: true
    },
    env: {
      DYNAMFIT_TEST_FILE: 'test_file.txt'
    }
  };

  const res = {
    header: () => true,
    status: sinon.mock().returnsThis,
    json: (value) => value
  };

  context('manageServiceRequest', () => {
    it('should return a 422 error if params appName is not in the register', async () => {
      const appName = 'dynamfits';
      req.params = { appName };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await manageServiceRequest(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(
        `Dynamfits service not available`,
        'getDynamfitChartData'
      );
    });

    it('should return a 200 success response and returns dynamfit chart data', async () => {
      const appName = 'dynamfit';
      req.params = { appName };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon.stub(axios, 'post').returns(dynafitSuccessResponse);
      sinon.stub(jwt, 'sign').returns('askle90lk.s409sjgl0ad.s0akng40');
      const result = await manageServiceRequest(req, res, next);
      expect(result).to.have.property('appName');
      expect(result.appName).to.equal(appName);
      expect(result).to.have.property('multi');
      expect(result).to.have.property('response');
      expect(result).to.have.property('error');
      expect(result.error).to.have.property('code');
      expect(result.error.code).to.equal('MM00010');
    });

    it('should return a error response returned from dynamfit managed service', async () => {
      const appName = 'dynamfit';
      req.params = { appName };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon.stub(jwt, 'sign').returns('askle90lk.s409sjgl0ad.s0akng40');
      sinon.stub(axios, 'post').returns(dynamfitErrorResponse);
      const result = await manageServiceRequest(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(dynamfitErrorResponse.data.message);
    });

    it('should return a 500 server error when dynamfit server is not accessible', async function () {
      const appName = 'dynamfit';
      req.params = { appName };
      const nextSpy = sinon.spy();
      sinon.stub(axios, 'post').throws();
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await manageServiceRequest(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('chemPropsSeed', () => {
    it('should return a 500 server error when chemprops server is not accessible', async function () {
      req.originalUrl = '/nm/chemprops/init';
      const nextSpy = sinon.spy();
      sinon.stub(axios, 'post').throws();
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await chemPropsSeed(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('dbRequest', () => {
    const req = {
      logger: { info: sinon.stub(), notice: sinon.stub(), error: sinon.stub() },
      params: { collectionName: 'polymer' }, // Replace 'TestModel' with your actual model name
      body: {
        action: 'INSERT',
        payload: [{ data: 'testData' }],
        findBy: { _id: 'someId' }
      },
      headers: {
        authorization: 'Bearer '
      }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      header: sinon.stub().returns(true)
    };
    const next = sinon.stub();

    it('should handle INSERT action with single payload when model is not registered yet', async () => {
      sinon.stub(mongoose, 'model').returns(Polymer);
      const createStub = sinon
        .stub(Polymer, 'create')
        .resolves({ _id: 'insertedId' });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(req, res, next);
      expect(createStub.calledWithExactly(req.body.payload[0])).to.be.true;
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly({ _id: 'insertedId' })).to.be.true;
    });

    it('should handle INSERT action with single payload when model is not registered yet', async () => {
      sinon.stub(mongoose, 'modelNames').returns([]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(req, res, next);
      expect(next.called).to.be.true;
    });

    it('should handle INSERT action with single payload', async () => {
      sinon.stub(mongoose, 'model').returns(Polymer);
      const createStub = sinon
        .stub(Polymer, 'create')
        .resolves({ _id: 'insertedId' });
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(req, res, next);
      expect(createStub.calledWithExactly(req.body.payload[0])).to.be.true;
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly({ _id: 'insertedId' })).to.be.true;
    });

    it('should handle INSERT action with multiple payload', async () => {
      const multiplePayloadReq = {
        ...req,
        body: {
          ...req.body,
          payload: [{ data: 'testData' }, { data: 'testData' }]
        },
        headers: {
          authorization: 'Bearer token'
        }
      };
      sinon.stub(jwt, 'verify').returns({ requestid: 'someId' });
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon
        .stub(Polymer, 'insertMany')
        .resolves([{ _id: 'insertedId' }, { _id: 'insertedId2' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(multiplePayloadReq, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(
        res.json.calledWithExactly([
          { _id: 'insertedId' },
          { _id: 'insertedId2' }
        ])
      ).to.be.true;
    });

    it('should handle INSERTMANY action with multiple payload', async () => {
      const multiplePayloadReq = {
        ...req,
        body: {
          action: 'INSERTMANY',
          payload: [{ data: 'testData' }, { data: 'testData' }]
        }
      };
      sinon.stub(mongoose, 'modelNames').returns([]);
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'deleteMany').resolves();
      sinon
        .stub(Polymer, 'insertMany')
        .resolves([{ _id: 'insertedId' }, { _id: 'insertedId2' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(multiplePayloadReq, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(
        res.json.calledWithExactly([
          { _id: 'insertedId' },
          { _id: 'insertedId2' }
        ])
      ).to.be.true;
    });

    it('should handle READ action and return 200 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'READ'
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'find').resolves([{ _id: 'insertedId' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly([{ _id: 'insertedId' }])).to.be.true;
    });

    it('should handle DELETE action and return 200 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'DELETE'
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'findOneAndDelete').resolves([{ _id: 'insertedId' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly([{ _id: 'insertedId' }])).to.be.true;
    });

    it('should handle UPDATE action and return 200 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'UPDATE'
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'findOneAndUpdate').resolves([{ _id: 'insertedId' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly([{ _id: 'insertedId' }])).to.be.true;
    });

    it('should handle SEARCH action and return 200 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'SEARCH',
          findBy: {
            _stdname: 'Poly'
          }
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'find').resolves([{ _id: 'insertedId' }]);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(res.status.calledWithExactly(200)).to.be.true;
      expect(res.json.calledWithExactly([{ _id: 'insertedId' }])).to.be.true;
    });

    it('should handle UPDATE action and a 404 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'UPDATE'
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'findOneAndUpdate').resolves(null);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(next.called).to.be.true;
    });

    it('should handle UPDATE action and a 500 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'UPDATE'
        }
      };
      const error = new Error();
      error.code = 11000;
      error.message =
        'E11000 duplicate key error collection: mgi.fillers index: _id_ dup key: { _id: "Aluminium oxide" }';
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon.stub(Polymer, 'findOneAndUpdate').throws(error);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(next.called).to.be.true;
    });

    it('should handle DELETE action and return 500 status', async () => {
      const readRequest = {
        ...req,
        body: {
          ...req.body,
          action: 'DELETE'
        }
      };
      sinon.stub(mongoose, 'model').returns(Polymer);
      sinon
        .stub(Polymer, 'findOneAndDelete')
        .throws(new Error('failed to delete'));
      sinon.stub(latency, 'latencyCalculator').returns(true);
      await dbRequest(readRequest, res, next);
      expect(next.called).to.be.true;
    });
  });
});
