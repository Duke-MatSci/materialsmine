const chai = require('chai');
const sinon = require('sinon');
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
  mockJsonStructure2,
  mockJsonStructure4,
  mockUploadedFiles 
} = require('../mocks')
const XlsxObject = require('../../src/models/curatedObject');
const XlsxCurationList = require('../../src/models/xlsxCurationList');
const XlsxFileManager = require('../../src/utils/xlsxFileManager');
const XlsxController = require('../../src/controllers/curationController');

const { expect } = chai;

describe('Xlsx Controllers Unit Tests:', function() {

  afterEach(() => sinon.restore());

  const req = { 
    logger: { info: (_message) => { }, error: (_message) => { }, notice: (_message) =>  {} },
    user,
    files: {}
  }

  const res = {
    status: () => {},
    json: () => {},
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

    it('should return a 400 error if material_template.xlsx file is not uploaded', async function() {
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

    it('should return a 400 error if error is found while processing the parsing spreadsheet', async function() {
      req.files.uploadfile = correctXlsxFile;
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ errors: { Origin: 'invalid value' } });
      sinon.stub(XlsxObject, 'find').returns([]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
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
      sinon.stub(XlsxObject, 'find').returns([mockCuratedXlsxObject]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
      sinon.stub(XlsxController, 'createMaterialObject').returns(mockCuratedXlsxObject);
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);

      expect(result).to.have.property('message');
    });

    it('should curateXlsx object', async function() {
      req.files.uploadfile = correctXlsxFile;
      const next = function (fn) {
        return fn;
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns(fetchedCuratedXlsxObject);
      sinon.stub(XlsxObject, 'find').returns([]);
      sinon.stub(XlsxCurationList, 'find').returns(mockCurationList);
      sinon.stub(XlsxController, 'createMaterialObject').returns(mockCuratedXlsxObject);
      sinon.stub(XlsxObject.prototype, 'save').callsFake(() => (fetchedCuratedXlsxObject))
      const result = await XlsxController.curateXlsxSpreadsheet(req, res, next);

      expect(result).to.have.property('object');
      expect(result).to.have.property('user');
    });

    it('should return a 500 server error', async function() {
      req.files.uploadfile = correctXlsxFile;
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XlsxCurationList, 'find').throws();

      await XlsxController.curateXlsxSpreadsheet(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  })

  context('getXlsxCurations', () => {
    it('should return 404 not found error', async () => {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(XlsxObject, 'findOne').returns(null);
      const result = await XlsxController.getXlsxCurations(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('Xlsx Object not found');
    })

    it('should return an xlsx curation when an xlsxObjectId is provided', async () => {
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

    it('should return an xlsx curation when an xlsxObjectId is provided and user is admin', async () => {
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

    it('should return a list of xlsx curations when an xlsxObjectId is not provided', async () => {
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

    it('should return a 500 server error', async function() {
      req.query = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XlsxObject, 'findOne').throws();

      await XlsxController.getXlsxCurations(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('updateXlsxCurations', () => {
    it('should return 404 not found error', async () => {
      req.body = { payload: mockCuratedXlsxObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(XlsxObject, 'findOne').returns(null);
      const result = await XlsxController.updateXlsxCurations(req, res, next);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('Xlsx Object not found');
    });

    it('Should return a message "No changes"', async () => {
      req.body = { payload: mockBaseObject }
      req.params = { xlsxObjectId: 'a90w49a40ao4094k4aed'}
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ message: "No changes"});
      sinon.stub(XlsxObject, 'findOne').returns(fetchedCuratedXlsxObject);

      const result = await XlsxController.updateXlsxCurations(req, res, next);

      expect(result).to.have.property('message');
      expect(result.message).to.equal("No changes");
    })

    it('should return an updated curation object', async () => {
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

    
    it('should return a 500 server error', async function() {
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
      const error = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure, mockCurationListMap);

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

    it('should return parsed and filtered xlsx object 2', async () => {
      
      sinon.stub(XlsxFileManager, 'xlsxFileReader').returns(mockSheetData3);
      const result = await XlsxController.createMaterialObject(correctXlsxFile[0].path, mockJsonStructure2, mockCurationListMap, mockUploadedFiles);
      expect(result).to.be.an('Object')
      expect(result).to.have.property('DMA Datafile');
      expect(result['DMA Datafile']).to.be.an('Array');
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
