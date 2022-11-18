const chai = require('chai');
const sinon = require('sinon');
const PixelData = require('../../../src/models/pixelated')
const graphQlSchema = require('../../../src/graphql');
const { Query: { pixelData } } = require('../../../src/graphql/resolver');

const { expect } = chai;

describe('PixelData Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const input = {
    unitCell: 'TEN',
    pageNumber: 1,
    pageSize: 1
  }

  const req = { logger: { info: (_message) => { }, error: (_message) => { } } }

  context('pixelData', () => {
    it('should return paginated lists of pixelData', async () => {
      const mockPixelData = {
        _id: 'akdn9wqknd90uaoikn9ahoi4489i',
        symmetry: 'C4v',
        unit_cell_x_pixels: '10',
        unit_cell_y_pixels: '10',
        geometry_condensed: '000000000001001',
        geometry_full: '1010000101000000000010000000010000000000000000000000000000000000000000100000000100000000001010000101',
        condition: 'Plane Strain',
        C11: '2963290579',
        C12: '1459531181',
        C22: '2963290579',
        skip: () => ({_id: 'akdn9wqkn', ...input }),
        lean: () => ({_id: 'akdn9wqkn', ...input }),
        limit: () => ({_id: 'akdn9wqkn', ...input })
      }
      sinon.stub(PixelData, 'countDocuments').returns(1);
      sinon.stub(PixelData, 'find').returns(mockPixelData);
      sinon.stub(mockPixelData, 'skip').returnsThis();
      sinon.stub(mockPixelData, 'limit').returnsThis();
      sinon.stub(mockPixelData, 'lean').returns([mockPixelData]);

      const pixelatedData = await pixelData({}, { input }, { req });
      expect(pixelatedData).to.have.property('data');
      expect(pixelatedData.totalItems).to.equal(1);
    });

    it("should throw a 400, input error", async () => {

      const error = await pixelData({}, { input: { unitCell: "BOTH" } }, { req }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(400);
    });

    it('should return a 500 error', async () => {
      sinon.stub(PixelData, 'countDocuments').returns(1);
      sinon.stub(PixelData, 'find').throws()

      const result = await pixelData({}, { input }, { req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });
  })
}); 
