const chai = require('chai');
const sinon = require('sinon');
const Xmljs = require('xml-js');
const {
  user,
  correctXlsxFile,
  wrongXlsxFile,
  mockCurationList,
  mockCuratedXlsxObject,
  fetchedCuratedXlsxObject,
  mockSheetData,
  mockSheetData2,
  updatedCuratedXlsxObject,
  mockBaseObject,
  mockJsonStructure,
  mockCurationListMap,
  mockSheetData3,
  mockSheetData4,
  mockSheetData5,
  mockJsonStructure2,
  mockJsonStructure4,
  mockJsonStructure5,
  mockUploadedFiles,
  mockDatasetId,
  mockXmlData,
  mockCSVData
} = require('../mocks')
const XlsxObject = require('../../src/models/curatedSamples');
const XlsxCurationList = require('../../src/models/xlsxCurationList');
const DatasetId = require('../../src/models/datasetId');
const XmlData = require('../../src/models/xmlData');
const XlsxFileManager = require('../../src/utils/curation-utility');
const XlsxController = require('../../src/controllers/curationController');
const { createMaterialObject } = require('../../src/controllers/curationController')
const { logger } = require('../common/utils')

const { expect } = chai;

describe('Curation Controller', function() {

  afterEach(() => sinon.restore());

  const req = { 
    logger,
    user,
    files: {}
  }

  const res = {
    header: () => {},
    status: () => {},
    json: () => {},
    send: () => {}
  };

  const next = function (fn) {
    return fn;
  };

  context('curateXlsxSpreadsheet', () => {
    it('should return a 400 error if no file is uploaded', async function() {
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal('Material template files not uploaded', 'createXlsxObject');
    });

    it('should return a 400 error if master_template.xlsx file is not uploaded', async function() {
      req.files.uploadfile = wrongXlsxFile
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal('Master template xlsx file not uploaded', 'createXlsxObject');
    });

    it('should return a 400 error if dataset query is not added', async function() {
        req.files.uploadfile = correctXlsxFile;
        req.query = { dataset: "" }
        const next = function (fn) {
          return fn;
        };
        sinon.stub(res, 'status').returnsThis();
        sinon.stub(res, 'json').returnsThis();
        const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);
  
        expect(result).to.have.property('message');
        expect(result.message).to.equal('Missing dataset ID in query', 'createXlsxObject');
      });

      it('should return a 400 error if provided dataset ID is not found in the database', async function() {
        req.files.uploadfile = correctXlsxFile;
        req.query = { dataset: '583e3d6ae74a1d205f4e3fd3' }
        const next = function (fn) {
          return fn;
        };
        sinon.stub(res, 'status').returnsThis();
        sinon.stub(res, 'json').returnsThis();
        sinon.stub(XlsxObject, 'find').returns([]);
        sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
        sinon.stub(DatasetId, 'findOne').returns(null);
        const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);
        expect(result).to.have.property('message');
        expect(result.message).to.equal(`A sample must belong to a dataset. Dataset ID: ${req.query.dataset ?? null} not found`, 'createXlsxObject');
      });


    it('should return a 400 error if error is found while processing the parsing spreadsheet', async function() {
      req.files.uploadfile = correctXlsxFile;
      req.query = { dataset: "583e3d6ae74a1d205f4e3fd3" }
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ errors: { Origin: 'invalid value' } });
      sinon.stub(XlsxObject, 'find').returns([]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
      sinon.stub(DatasetId, 'findOne').returns(mockDatasetId);
      sinon.stub(XlsxController, 'createMaterialObject').returns( { count: 1, errors: { Origin: 'invalid value' }});
      
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);
      expect(result).to.have.property('errors');
    });

    it('should return a 409 conflict error if curated sheet has same title and publication year', async function() {
      req.files.uploadfile = correctXlsxFile;
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(DatasetId, 'findOne').returns(mockDatasetId);
      sinon.stub(XlsxObject, 'find').returns([mockCuratedXlsxObject]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
      sinon.stub(XlsxController, 'createMaterialObject').returns(mockCuratedXlsxObject);
     
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);
      expect(result).to.have.property('message');
    });

    it('should curate master template', async function() {
      req.files.uploadfile = correctXlsxFile;
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(fetchedCuratedXlsxObject);
      sinon.stub(res, 'send').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'find').returns([]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
      sinon.stub(DatasetId, 'findOne').returns(mockDatasetId);
      sinon.stub(XlsxController, 'createMaterialObject').returns(mockCuratedXlsxObject);
      sinon.stub(XlsxObject.prototype, 'save').callsFake(() => (fetchedCuratedXlsxObject))
      sinon.stub(Xmljs, 'json2xml').returns(fetchedCuratedXlsxObject)

      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);

      expect(result).to.have.property('object');
      expect(result).to.have.property('user');
    });

    it('should return a 500 server error when database throws an error', async function() {
      req.files.uploadfile = correctXlsxFile;
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XlsxCurationList, 'find').throws();

      await XlsxController.curateXlsxSpreadsheet(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  })

  context('Retrieve curations', () => {
    it('should return 404 not found error if req.query ID is invalid', async () => {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(XlsxObject, 'findOne').returns(null);
      const result = await XlsxController.getXlsxCurations(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('Curation sample not found');
    })

    it('should return 404 not found error if req.query ID is invalid', async () => {
      req.query = { xmlId: 'a90w49a40ao4094k4aed'}
      sinon.stub(XmlData, 'findOne').returns(null);
      const result = await XlsxController.getXlsxCurations(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('Sample xml not found');
    });

    it('returns a curation data when a valid req.query ID is provided', async () => {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'findOne').returns(fetchedCuratedXlsxObject);
      
      const result = await XlsxController.getXlsxCurations(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('object');
      expect(result).to.have.property('user');
    });

    it('returns curated object when an ID is provided and user is admin', async () => {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'};
      req.user.roles = 'admin'
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'findOne').returns(fetchedCuratedXlsxObject);
      
      const result = await XlsxController.getXlsxCurations(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('object');
      expect(result).to.have.property('user');
    })
    it('should return curation object when an xmlId is provided', async () => {
        req.query = { xmlId: 'a90w49a40ao4094k4aed'}
        const next = function (fn) {
          return fn;
        };
        sinon.stub(res, 'status').returnsThis();
        sinon.stub(res, 'json').returns(mockCuratedXlsxObject);
        sinon.stub(XmlData, 'findOne').returns(mockXmlData);
        sinon.stub(Xmljs, 'xml2json').returns(mockCuratedXlsxObject)
        
        const result = await XlsxController.getXlsxCurations(req, res, next);

        expect(result).to.be.an('Object');
        expect(result).to.have.property('DATA_SOURCE');
      });

    it('returns list of curations when an ID is not provided', async () => {
      req.query = { xlsxObjectId: null }
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(Array(3).fill(fetchedCuratedXlsxObject));
      sinon.stub(XlsxObject, 'find').returns({ object: Array(3).fill(fetchedCuratedXlsxObject), select: sinon.stub().returnsThis()});
      
      const result = await XlsxController.getXlsxCurations(req, res, next);
      expect(result).to.be.an('Array');
      expect(result[0]).to.have.property('object');
      expect(result[0]).to.have.property('user');
    })

    it('should return a 500 server error when database throws an error', async function() {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XlsxObject, 'findOne').throws();

      await XlsxController.getXlsxCurations(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('Update Curations', () => {
    it('should return 404 not found error if ID is invalid', async () => {
      req.body = { payload: mockCuratedXlsxObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(XlsxObject, 'findOne').returns(null);
      const result = await XlsxController.updateXlsxCurations(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal(`Curated sample ID: ${req.params.xlsxObjectId} not found`);
    });

    it('Should return a message "No changes" if no changes occurred with submitted payload', async () => {
      req.body = { payload: mockBaseObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ message: "No changes"});
      sinon.stub(XlsxObject, 'findOne').returns(fetchedCuratedXlsxObject);

      const result = await XlsxController.updateXlsxCurations(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal("No changes");
    })

    it('should update curation object with submitted payload', async () => {
      req.body = { payload: updatedCuratedXlsxObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'findOne').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'findOneAndUpdate').returns(fetchedCuratedXlsxObject);

      const result = await XlsxController.updateXlsxCurations(req, res, next);
      
      expect(result).to.be.an('Object');
      expect(result).to.have.property('object');
      expect(result).to.have.property('user');
    });

    
    it('should return a 500 server error when database throws an error', async function() {
      req.body = { payload: mockCuratedXlsxObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XlsxObject, 'findOne').throws();

      await XlsxController.updateXlsxCurations(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('createMaterialObject', () => {
    it('should return error object', async () => {
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData);
      const error = await createMaterialObject(correctXlsxFile[0].path, mockJsonStructure, mockCurationListMap);

      expect(error).to.be.an('Object')
      expect(error).to.have.property('count');
      expect(error).to.have.property('errors');
    });
    it('should return parsed and filtered xlsx object 1', async () => {
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData2);
      const result = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure, mockCurationListMap);

      expect(result).to.be.an('Object')
      expect(result).to.have.property('Your Name');
    });
    it('should return parsed and filtered xlsx object for varied_multiple types', async () => {
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData5);
      const result = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure5, mockCurationListMap);

      expect(result).to.be.an('Object')
      expect(result).to.have.property('MeltMixing');
    });
    it('should return parsed and filtered xlsx object 2', async () => {
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData3);
      sinon.stub(XlsxFileManager, 'parseCSV').returns(mockCSVData);
      const result = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure2, mockCurationListMap, mockUploadedFiles);
      expect(result).to.be.an('Object');
      expect(result).to.have.property('DMA Datafile');
      expect(result['DMA Datafile']).to.be.an('Array');
      // expect(result['DMA Datafile'][1]).to.have.property('data');
    });

    it('should return parsed and filtered xlsx object 3 handling default', async () => {
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData4);
      const result = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure4, mockCurationListMap, mockUploadedFiles);

      expect(result).to.be.an('Object')
      expect(result).to.have.property('Microstructure');
      expect(result.Microstructure).to.have.property('Imagefile');
      expect(result.Microstructure.Imagefile).to.be.an('Array');
    });
    it('should return error when file is not uploaded', async () => {
      
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData3);
      const error = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure2, mockCurationListMap, correctXlsxFile);

      expect(error).to.be.an('Object')
      expect(error).to.have.property('count');
      expect(error).to.have.property('errors');
    });
  });

  context('Get curation base schema object', () => {
    it('should return a partial json structure when query param is present', async () => {
      req.query = { sheetName: 'Data Origin'}
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(mockJsonStructure);

      const result = await XlsxController.getCurationSchemaObject(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('Your Name');
    });

    it('Returns the whole base schema object structure if no query param is provided', async () => {
      req.query = { sheetName: '' }
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(mockJsonStructure2);

      const result = await XlsxController.getCurationSchemaObject(req, res, next);

      expect(result).to.be.an('Object');
      expect(result).to.have.property('DMA Datafile');
    });
  })
});
