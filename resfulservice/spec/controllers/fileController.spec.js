const { expect } = require('chai');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const { next, mockFSFiles, mockBucket, mockDownloadStream, mockEmptyStream, mockFindObjectStream } = require('../mocks');
const FileController = require('../../src/controllers/fileController');
const FsFile = require('../../src/models/fsFiles');
const FileManager = require('../../src/utils/fileManager')
const latency = require('../../src/middlewares/latencyTimer');
const minioClient = require('../../src/utils/minio');

 
describe('File Controller Unit Tests:', function() {
  afterEach(() => sinon.restore());

  const req = { 
    logger,
    files: {},
    env: { FILES_DIRECTORY: 'file_directory' }
  }

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
      
      req.params = { imageType: 'charts'};
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(latency, 'latencyCalculator').returns(true)
      const result = await FileController.imageMigration(req, res, next);
      expect(result).to.have.property('images');
    });
    it('should return a 500 server error', async function() {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(FileController, 'connectToMongoBucket').throws();
      await FileController.imageMigration(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('fileContent', () => {
    req.params = { fileId: '638dd8e9af9d478e0136ffcb' };
    
    it('should successfully stream files from mongo bucket', async () => {
      req.query = { isDirectory: false, isBucket: false };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FsFile, 'findById').returns(mockFSFiles);
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledOnce(mockDownloadStream.pipe);
    });

    it('should empty stream files from mongo bucket', async () => {
      req.query = { isDirectory: false, isBucket: false };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FsFile, 'findById').returns({ limit: sinon.stub().returns(null)});
      sinon.stub(FileController, 'connectToMongoBucket').returns(mockBucket);
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledOnce(mockEmptyStream.pipe);
    });

    it('should successfully stream file from the file system', async () => {
      req.query = { isDirectory: true, isBucket: false };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FileManager, 'findFile').returns(mockDownloadStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledTwice(mockDownloadStream.pipe);
    });

    it('should return empty stream file from the file system', async () => {
      req.query = { isDirectory: true, isBucket: false };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(FileManager, 'findFile').returns(null);
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledTwice(mockEmptyStream.pipe);
    });

    it('should successfully stream file from minio bucket', async () => {
      req.query = { isDirectory: false, isBucket: true };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(minioClient, 'getObject').returns(mockDownloadStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledThrice(mockDownloadStream.pipe);
    });

    it('should return empty stream file from minio bucket', async () => {
      req.query = { isDirectory: false, isBucket: true };
      const files = [[{ path: '/images/cat.png'}, { path: '/images/dog.png'}]];
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ images: files });
      sinon.stub(minioClient, 'getObject').returns(null);
      sinon.stub(FileController, '_createEmptyStream').returns(mockEmptyStream);
      sinon.stub(res, 'setHeader').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.fileContent(req, res, next);
      sinon.assert.calledThrice(mockEmptyStream.pipe);
    });

    it('should return a 500 server error', async function() {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(FileController, 'connectToMongoBucket').throws();
      await FileController.fileContent(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });


  context('uploadFile', () => {
    it('should return success when files successful upload', async () => {
      req.files = { uploadfile: [{ path: '/images/cat.png'}, { path: '/images/dog.png'}]};
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ files: req.files.uploadfile });
      sinon.stub(latency, 'latencyCalculator').returns(true)

      const result = await FileController.uploadFile(req, res, next);

      expect(result).to.have.property('files');
    });
    it('should return a 500 server error', async function() {
      const nextSpy = sinon.spy();
      req.files = { uploadfile: [{ path: '/images/cat.png'}, { path: '/images/dog.png'}]};
      sinon.stub(res, 'status').throws();
      // sinon.stub(res, 'json').returns({ data: response.data.hits });

      await FileController.uploadFile(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  });

  context('deleteFile', () => {
    req.params = { fileId: '638dd8e9af9d478e0136ffcb' };
    it('should delete a file from both file system and minio',  async () => {
      sinon.stub(minioClient, 'removeObject').returns(true);
      sinon.stub(FileManager, 'deleteFile').returns(true);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      await FileController.deleteFile(req, res, next);
      sinon.assert.calledOnce(res.sendStatus);
    })

    it('should return a 500 server error when deleting a file', async function() {
      const nextSpy = sinon.spy();
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(minioClient, 'removeObject').throws();
      await FileController.deleteFile(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  })

  context('findFiles', () => {
    req.query = { filename: '001.tif'}
    it('should find files based on filename query from minio',  async () => {
      sinon.stub(res, 'status').returnsThis()
      sinon.stub(minioClient, 'listObjects').returns(mockFindObjectStream);
      sinon.stub(latency, 'latencyCalculator').returns(true)

      FileController.findFiles(req, res, next);
      // sinon.assert.calledThrice(mockFindObjectStream.on);
      sinon.assert.called(mockFindObjectStream.on);
    })
  })
})
