const { expect } = require('chai');
const graphQlSchema = require('../../../src/graphql');

describe('PixelData Schema Unit Tests:', function () {

  it('should have pixelData as a RootQuery field', async function () {
    const { pixelData } = graphQlSchema.getQueryType().getFields();
    expect(pixelData.name).to.equal('pixelData');
    expect(pixelData.type.toString()).to.equal('PixelatedData!');
  });

  it('should have correct fields for pixeData schema', async function () {
    const pixelData = graphQlSchema.getType('PixelData');
    const keys = Object.keys(pixelData.getFields());
    expect(keys).to.include.members(['_id', 'symmetry', 'unit_cell_x_pixels', 'unit_cell_y_pixels', 'geometry_condensed', 'geometry_full', 'condition']);
  });

  it('should have correct datatypes for Contact schema', async function () {
    const pixelData = graphQlSchema.getType('PixelData');
    const { _id, symmetry, unit_cell_x_pixels, unit_cell_y_pixels, geometry_condensed,  geometry_full, condition } = pixelData.getFields();

    expect(_id.type.toString()).to.equal('ID');
    expect(symmetry.type.toString()).to.equal('String');
    expect(unit_cell_x_pixels.type.toString()).to.equal('String');
    expect(unit_cell_y_pixels.type.toString()).to.equal('String');
    expect(geometry_condensed.type.toString()).to.equal('String');
    expect(geometry_full.type.toString()).to.equal('String');
    expect(condition.type.toString()).to.equal('String');
  });

  it("should have ['totalItems', 'pageSize', 'pageNumber', 'totalPages', 'hasPreviousPage', 'hasNextPage', 'data'] PixelatedData schema", async function () {
    const pixelatedData = graphQlSchema.getType('PixelatedData');
    const keys = Object.keys(pixelatedData.getFields());
    expect(keys).to.include.members(['totalItems', 'pageSize', 'pageNumber', 'totalPages', 'hasPreviousPage', 'hasNextPage', 'data']);
  });

  it('should have correct datatypes for PixelatedData schema', async function () {
    const pixelatedData = graphQlSchema.getType('PixelatedData');
    const { totalItems, pageSize, pageNumber, totalPages, hasPreviousPage, hasNextPage, data } = pixelatedData.getFields();

    expect(totalItems.type.toString()).to.equal('Int');
    expect(pageSize.type.toString()).to.equal('Int!');
    expect(pageNumber.type.toString()).to.equal('Int!');
    expect(totalPages.type.toString()).to.equal('Int!');
    expect(hasPreviousPage.type.toString()).to.equal('Boolean!');
    expect(hasNextPage.type.toString()).to.equal('Boolean!');
    expect(data.type.toString()).to.equal('[PixelData!]!');
  });
}); 
