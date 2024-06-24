const { expect } = require('chai');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const {
  next,
  mockFSFiles,
  mockBucket,
  mockDataset,
  mockDownloadStream,
  mockEmptyStream,
  mockFindObjectStream
} = require('../mocks');
const FileController = require('../../src/controllers/fileController');
const FsFile = require('../../src/models/fsFiles');
const FileManager = require('../../src/utils/fileManager');
const DatasetFileManager = require('../../src/utils/curation-utility');
const latency = require('../../src/middlewares/latencyTimer');
const minioClient = require('../../src/utils/minio');
const fsFiles = require('../../src/models/fsFiles');

describe('File Controller Unit Tests:', function () {
  afterEach(() => sinon.restore());

  const req = {
    logger,
    files: {},
    env: { FILES_DIRECTORY: 'file_directory', MINIO_BUCKET: undefined }
  };

  const res = {
    header: () => {},
    status: () => {},
    json: () => {},
    send: () => {},
    setHeader: () => {},
    sendStatus: sinon.spy()
  };

  context('imageMigration', () => {
    it('should return success when files successful upload', async () => {
      req.params = { imageType: 'charts' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(latency, 'latencyCalculator').returns(true);
      const result = await FileController.imageMigration(req, res, next);
      expect(result).to.have.property('images');
    });
    it('should return a 500 server error', async function () {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(FileController, 'connectToMongoBucket').throws();
      await FileController.imageMigration(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('fileContent', () => {
    req.params = { fileId: '001.tiff' };

    it('should successfully stream files from mongo bucket', async () => {
      req.query = { isFileStore: 'false', isStore: 'false' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FsFile, 'findById').returns(mockFSFiles);
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledOnce(mockDownloadStream.pipe);
    });

    it('should empty stream files from mongo bucket', async () => {
      req.query = { isFileStore: 'false', isStore: 'false' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon
        .stub(FsFile, 'findById')
        .returns({ limit: sinon.stub().returns(null) });
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledOnce(mockEmptyStream.pipe);
    });

    it('should successfully stream file from the file system', async () => {
      req.query = { isFileStore: 'true', isStore: 'false' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon
        .stub(FileManager, 'findFile')
        .returns({ fileStream: mockDownloadStream, ext: '.jpeg' });
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledTwice(mockDownloadStream.pipe);
    });

    it('should return empty stream file from the file system', async () => {
      req.query = { isFileStore: 'true', isStore: 'false' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon
        .stub(FileManager, 'findFile')
        .returns({ fileStream: null, ext: '.jpeg' });
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledTwice(mockEmptyStream.pipe);
    });

    it('should successfully stream file from minio bucket', async () => {
      req.query = { isFileStore: 'false', isStore: 'true' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(minioClient, 'getObject').returns(mockDownloadStream);
      sinon.stub(FileManager, 'getFileExtension').returns('.tiff');
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledThrice(mockDownloadStream.pipe);
    });

    it('should return empty stream file from minio bucket', async () => {
      req.query = { isFileStore: 'false', isStore: 'true' };
      const files = [
        [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      ];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(minioClient, 'getObject').returns(null);
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.fileContent(req, res, next);
      sinon.assert.calledThrice(mockEmptyStream.pipe);
    });

    it('should return a 500 server error', async function () {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(FileController, 'connectToMongoBucket').throws();
      await FileController.fileContent(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('uploadFile', () => {
    it('should return success when files successfully upload', async () => {
      req.files = {
        uploadfile: [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ files: req.files.uploadfile });
      sinon.stub(latency, 'latencyCalculator').returns(true);

      const result = await FileController.uploadFile(req, res, next);

      expect(result).to.have.property('files');
    });
    it('should return a 500 server error', async function () {
      const nextSpy = sinon.spy();
      req.files = {
        uploadfile: [{ path: '/images/cat.png' }, { path: '/images/dog.png' }]
      };
      sinon.stub(res, 'status').throws();
      // sinon.stub(res, 'json').returns({ data: response.data.hits });

      await FileController.uploadFile(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('deleteFile', () => {
    it('should delete a file from both file system and minio', async () => {
      req.params = {
        fileId:
          '/api/files/zany_cheetah_sunshine-2024-06-24T09:20:03.429Z-homedashboard1.png?isStore=true'
      };
      sinon.stub(minioClient, 'removeObject').returns(true);
      sinon.stub(FileManager, 'deleteFile').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.deleteFile(req, res, next);
      sinon.assert.calledOnce(res.sendStatus);
    });

    it('should delete a from mongo database', async () => {
      req.params.fileId = '638dd8e9af9d478e0136ffcb';
      sinon.stub(fsFiles, 'findByIdAndDelete').resolves(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      await FileController.deleteFile(req, res, next);
      sinon.assert.calledTwice(res.sendStatus);
    });

    it('should return a 500 server error when deleting a file', async function () {
      req.params.fileId =
        '/api/files/zany_cheetah_sunshine-2024-06-24T09:20:03.429Z-homedashboard1.png?isStore=true';
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(minioClient, 'removeObject').throws();
      await FileController.deleteFile(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('getMetamineFileNames', () => {
    it('should find metamine filenames from minio', async () => {
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(minioClient, 'listObjects').returns(mockFindObjectStream);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      FileController.getMetamineFileNames(req, res, next);
      sinon.assert.called(mockFindObjectStream.on);
    });

    it('should return a 500 server error when searching for metamine filename', async function () {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(minioClient, 'listObjects').throws();
      await FileController.getMetamineFileNames(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('fetchMetamineDatasets', () => {
    it('should return the metamine json data', async () => {
      req.params = { fileName: 'freeform_2d_sample.csv' };
      // const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ fetchedData: mockDataset });
      sinon.stub(DatasetFileManager, 'parseCSV').returns(mockDataset);
      sinon.stub(minioClient, 'getObject').returns(mockDownloadStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true);

      const result = await FileController.fetchMetamineDatasets(req, res, next);
      expect(result).to.have.property('fetchedData');
    });
    it('should return an error if file does not exist', async () => {
      req.params = { fileName: 'freeform_2d_sample.csv' };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(latency, 'latencyCalculator').returns(true);
      sinon.stub(minioClient, 'getObject').returns(null);

      const result = await FileController.fetchMetamineDatasets(req, res, next);
      expect(result).to.have.property('message');
    });
  });
});
