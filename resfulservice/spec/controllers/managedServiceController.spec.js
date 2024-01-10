const { expect } = require('chai');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const { next } = require('../mocks');
const {
  getDynamfitChartData
} = require('../../src/controllers/managedServiceController');
const latency = require('../../src/middlewares/latencyTimer');
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
    logger
  };

  const res = {
    header: () => true,
    status: sinon.mock().returnsThis,
    json: (value) => value
  };

  context('getDynamfitChartData', () => {
    it('should return a 422 error if params appName is not in the register', async () => {
      const appName = 'dynamfits';
      req.params = { appName };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await getDynamfitChartData(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(
        `${appName} service not available`,
        'getDynamfitChartData'
      );
    });

    it('should return a 200 success response and returns dynamfit chart data', async () => {
      const appName = 'dynamfit';
      req.params = { appName };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon.stub(axios, 'post').returns(dynafitSuccessResponse);
      sinon.stub(jwt, 'sign').returns('askle90lk.s409sjgl0ad.s0akng40');
      const result = await getDynamfitChartData(req, res, next);
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
      const result = await getDynamfitChartData(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(dynamfitErrorResponse.data.message);
    });

    it('should return a 500 server error when dynamif server is not accessible', async function () {
      const appName = 'dynamfit';
      req.params = { appName };
      const nextSpy = sinon.spy();
      sinon.stub(axios, 'post').throws();
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await getDynamfitChartData(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });
});
