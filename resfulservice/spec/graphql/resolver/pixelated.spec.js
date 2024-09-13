const chai = require('chai');
const sinon = require('sinon');
const PixelData = require('../../../src/models/pixelated');
const {
  Query: { pixelData }
} = require('../../../src/graphql/resolver');
const { mockPixelData, pixelatedDataInput } = require('../../mocks');
const { expect } = chai;

describe('PixelData Resolver Unit Tests:', function () {
  afterEach(() => sinon.restore());

  this.timeout(10000);

  const req = { logger: { info: (_message) => {}, error: (_message) => {} } };

  context('pixelData', () => {
    it('should return paginated lists of pixelData', async () => {
      sinon.stub(PixelData, 'countDocuments').returns(1);
      sinon.stub(PixelData, 'find').returns(mockPixelData);
      sinon.stub(mockPixelData, 'skip').returnsThis();
      sinon.stub(mockPixelData, 'limit').returnsThis();
      sinon.stub(mockPixelData, 'lean').returns([mockPixelData]);

      const pixelatedData = await pixelData(
        {},
        { input: pixelatedDataInput },
        { req }
      );
      expect(pixelatedData).to.have.property('data');
      expect(pixelatedData.totalItems).to.equal(1);
    });

    it('should throw a 400, input error', async () => {
      const error = await pixelData(
        {},
        { input: { unitCell: 'BOTH' } },
        { req }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(400);
    });

    it('should return a 500 error', async () => {
      sinon.stub(PixelData, 'countDocuments').returns(1);
      sinon.stub(PixelData, 'find').throws();

      const result = await pixelData(
        {},
        { input: pixelatedDataInput },
        { req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });
});
