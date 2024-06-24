const chai = require('chai');
const sinon = require('sinon');
const FavoriteChart = require('../../src/models/favoriteChart');
const {
  addFavoriteChart,
  getFavoriteCharts,
  removeFavoriteChart
} = require('../../src/controllers/favoritesController');
const {
  next,
  mockFavoriteChart,
  mockElasticSearchChartsResult
} = require('../mocks');
const { logger } = require('../common/utils');
const elasticSearch = require('../../src/utils/elasticSearch');
const latency = require('../../src/middlewares/latencyTimer');
const { expect } = chai;

describe('Favourites Controllers Unit Tests:', function () {
  afterEach(() => sinon.restore());

  const req = { logger, query: {} };

  const res = {
    status: sinon.stub().returnsThis(),
    json: (value) => value
  };

  context('addFavoriteChart', () => {
    it('should return success when chart is added to favorites', async () => {
      req.body = { chart: 'chart1' };
      req.user = { _id: 'testuser' };
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon
        .stub(FavoriteChart, 'findOneAndUpdate')
        .returns({ ...mockFavoriteChart, _id: 'akdn9wqkn' });
      const result = await addFavoriteChart(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('message');
      expect(result.message).to.equal(
        'This chart is now added to your favourite list successfully.'
      );
    });

    it('should return error when chart is not added to favorites and throws error', async () => {
      req.body = { chart: 'chart1' };
      req.user = { _id: 'testuser' };
      const error = new Error();
      const nextSpy = sinon.spy();
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon.stub(FavoriteChart, 'findOneAndUpdate').throws(error);
      await addFavoriteChart(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('removeFavoriteChart', () => {
    it('should return success when chart is removed from favorite list', async () => {
      req.body = { chart: 'chart1' };
      req.user = { _id: 'testuser' };

      sinon.stub(FavoriteChart, 'findOneAndUpdate').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await removeFavoriteChart(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('message');
      expect(result.message).to.equal(
        'This chart is now removed from your favourite list successfully.'
      );
    });

    it('should return error when chart is not removed from favorites and throws error', async () => {
      req.user = { _id: 'testuser' };
      const error = new Error();
      const nextSpy = sinon.spy();

      sinon.stub(FavoriteChart, 'findOneAndUpdate').throws(error);
      await removeFavoriteChart(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context.skip('getFavoriteCharts', () => {
    it('should return success and empty chart list when no favorite charts', async () => {
      req.user = { _id: 'testuser' };

      sinon.stub(FavoriteChart, 'findOne').returns(null);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await getFavoriteCharts(req, res, next);
      expect(result).to.be.an('Object');
      expect(result).to.have.property('data');
      expect(result).to.have.property('total');
    });
  });

  it.skip('should return success and list of user favorite charts', async () => {
    req.user = { _id: 'testuser' };

    sinon.stub(FavoriteChart, 'findOne').returns(mockFavoriteChart);
    sinon
      .stub(elasticSearch, 'loadAllCharts')
      .returns(mockElasticSearchChartsResult);
    sinon.stub(latency, 'latencyCalculator').returns(true);
    const result = await getFavoriteCharts(req, res, next);
    expect(result).to.be.an('Object');
    expect(result).to.have.property('data');
    expect(result).to.have.property('total');
  });

  it('should return error when server error', async () => {
    req.user = { _id: 'testuser' };
    const error = new Error();
    const nextSpy = sinon.spy();

    sinon.stub(FavoriteChart, 'findOne').throws(error);
    await getFavoriteCharts(req, res, nextSpy);
    sinon.assert.calledOnce(nextSpy);
  });
});
