const axios = require('axios');
const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const {
  mockTasks,
  mockNonExistingService,
  mockImageConversionInfo,
  mockKnowledgeRequestInfo,
  mockSparqlResult,
  fetchedCuration
} = require('../../mocks');
const { logger } = require('../../common/utils');
const {
  workerManager,
  convertImageToPng,
  knowledgeRequest
} = require('../../../src/sw/utils/worker-services');
const KnowledgeController = require('../../../src/controllers/kgWrapperController');
const Task = require('../../../src/sw/models/task');
const CuratedSamples = require('../../../src/models/curatedSamples');
const minioClient = require('../../../src/utils/minio');

describe('Worker Services', function () {
  beforeEach(() => {
    axiosStub = sinon
      .stub(axios, 'get')
      .resolves({ data: { dateTime: new Date().toISOString() } });
    clock = sinon.useFakeTimers();
  });
  afterEach(() => sinon.restore());

  context('workerManager', () => {
    it('should log an error when the task serviceName is not available', async () => {
      sinon.stub(Task, 'find').returns(mockNonExistingService);
      const loggerSpy = sinon.spy(logger, 'error');
      await workerManager(logger);
      sinon.assert.calledWith(loggerSpy, 'Service compressVideo not available');
    });

    it('should log an information when task returns status Completed', async () => {
      sinon.stub(Task, 'find').returns(mockTasks);
      const loggerSpy = sinon.spy(logger, 'info');
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().returns(true);
      sinon.stub(CuratedSamples, 'findOne').returns(fetchedCuration);
      sinon.stub(CuratedSamples, 'findOneAndUpdate').returns(true);
      sinon.stub(minioClient, 'statObject').throws();
      sinon.stub(minioClient, 'fPutObject').returns(true);
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      sinon.stub(Task, 'findOneAndDelete').returns(true);
      await workerManager(logger);
      sinon.assert.called(loggerSpy);
    });

    it('should log an information when task returns status Missing', async () => {
      sinon.stub(Task, 'find').returns(mockTasks);
      const loggerSpy = sinon.spy(logger, 'info');
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().throws();
      isFileExistStub.onCall(3).throws();
      sinon.stub(minioClient, 'statObject').throws();
      sinon.stub(Task, 'findOneAndUpdate').returns(true);
      await workerManager(logger);
      sinon.assert.called(loggerSpy);
    });
  });

  context('convertImageToPng', () => {
    it('should return status Failed when sharp failed to convert file to png', async () => {
      sinon.stub(fs.promises, 'access').returns(true);
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });

    it('should log error if file fs module could not copy file to temp file', async () => {
      sinon.stub(fs.promises, 'access').returns(true);
      sinon.stub(fs, 'copyFileSync').throws();
      const loggerSpy = sinon.spy(logger, 'error');
      await convertImageToPng(mockImageConversionInfo, logger);
      sinon.assert.called(loggerSpy);
    });

    it('should return status Failed when sharp failed to convert temp file to png', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().returns(true);
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });

    it('should return status completed and delete task when curation is not found', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().throws();
      isFileExistStub.onCall(3).returns(true);
      sinon.stub(CuratedSamples, 'findOne').returns(null);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Completed');
      expect(result.isSuccess).to.equals(true);
    });
    it('should return status Failed when querying the database', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().returns(true);
      sinon.stub(CuratedSamples, 'findOne').returns(fetchedCuration);
      sinon.stub(CuratedSamples, 'findOneAndUpdate').throws();
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });
    it('should return status Failed if file failed to upload', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().returns(true);
      sinon.stub(CuratedSamples, 'findOne').returns(fetchedCuration);
      sinon.stub(CuratedSamples, 'findOneAndUpdate').returns(true);
      sinon.stub(minioClient, 'statObject').throws();
      sinon.stub(minioClient, 'fPutObject').throws();
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });
    it('should return Completed if file failed to upload', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().returns(true);
      sinon.stub(CuratedSamples, 'findOne').returns(fetchedCuration);
      sinon.stub(CuratedSamples, 'findOneAndUpdate').returns(true);
      sinon.stub(minioClient, 'statObject').throws();
      sinon.stub(minioClient, 'fPutObject').returns(true);
      sinon.stub(fs, 'copyFileSync').returns(true);
      sinon.stub(fs, 'unlink').returns(true);
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Completed');
      expect(result.isSuccess).to.equals(true);
    });
    it('should return status Missing if file is not uploaded and not in temp store', async () => {
      const isFileExistStub = sinon.stub(fs.promises, 'access');
      isFileExistStub.onFirstCall().throws();
      isFileExistStub.onSecondCall().throws();
      isFileExistStub.onThirdCall().throws();
      isFileExistStub.onCall(3).throws();
      sinon.stub(minioClient, 'statObject').throws();
      const result = await convertImageToPng(mockImageConversionInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Missing');
      expect(result.isSuccess).to.equals(false);
    });
  });

  context('knowledgeRequest', () => {
    it('should return status completed', async () => {
      sinon.stub(KnowledgeController, 'getSparql').returns(mockSparqlResult);
      const result = await knowledgeRequest(mockKnowledgeRequestInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Completed');
      expect(result.isSuccess).to.equals(true);
    });

    it('should return status failed', async () => {
      sinon.stub(KnowledgeController, 'getSparql').returns(null);
      const result = await knowledgeRequest(mockKnowledgeRequestInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });

    it('should return status failed when error is thrown', async () => {
      sinon
        .stub(KnowledgeController, 'getSparql')
        .throws('Error in get sparql');
      const result = await knowledgeRequest(mockKnowledgeRequestInfo, logger);
      expect(result).to.have.property('status');
      expect(result).to.have.property('isSuccess');
      expect(result.status).to.equals('Failed');
      expect(result.isSuccess).to.equals(false);
    });
  });
});
