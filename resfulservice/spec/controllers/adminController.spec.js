const chai = require('chai');
const sinon = require('sinon');
const DatasetProperty = require('../../src/models/datasetProperty');
const { getDatasetProperties } = require('../../src/controllers/adminController');
const { next } = require('../mocks');
const { expect } = chai;

const mockDatasetProperties =  [
  {
    attribute: 'http://materialsmine.org/ns/RealPermittivity',
    label: 'Real Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealRelativePermittivity',
    label: 'Real Relative Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/DielectricRealPermittivity',
    label: 'Dielectric Real Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealImpedance',
    label: 'Real Impedance'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealPartOfConductivity',
    label: 'Real part of Conductivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealPartOfPermittivity',
    label: 'Real part of Permittivity'
  }
]

const fetchedDatasetProperties = {
  select: (properties) => mockDatasetProperties
}

describe('Admin Controllers Unit Tests:', function() {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const req = { logger: { info: (_message) => { }, error: (_message) => { } } }

  const res = {
    status: () => {},
    json: () => {},
  };



  context('getDatasetProperties', () => {
    it('should return a 400 error if no search query params', async function() {
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      const result = await getDatasetProperties(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal("search query params is missing");
    });

    it('should return a list of filtered dataset properties', async function() {
      req.query = { search: 'Loss' }
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({data: mockDatasetProperties});
      sinon.stub(DatasetProperty, 'find').returns(fetchedDatasetProperties)
      const result = await getDatasetProperties(req, res, next);

      expect(result).to.have.property('data');
    });

    it.skip('should return a 500 server error', async function() {
      req.query = { search: 'Loss' }

      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({message: 'Server Error'});
      sinon.stub(DatasetProperty, 'find').throws('Error connecting to database');

      const result = await getDatasetProperties(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('Error connecting to database');
    });
  })
})
