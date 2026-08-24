const fs = require('fs');
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const XmlData = require('../../src/models/xmlData');
const CuratedSample = require('../../src/models/curatedSamples');
const FileManager = require('../../src/utils/fileManager');
const JobsController = require('../../src/controllers/jobs');
const { logger } = require('../common/utils');
const { next } = require('../mocks');

const { expect } = chai;

describe('Jobs Controller', function () {
  afterEach(() => sinon.restore());

  const validId1 = new mongoose.Types.ObjectId().toString();
  const validId2 = new mongoose.Types.ObjectId().toString();
  const validId3 = new mongoose.Types.ObjectId().toString();

  const req = {
    logger,
    body: {},
    env: { FILES_DIRECTORY: 'mm_files' }
  };

  const res = {
    header: () => {},
    get: () => String(Date.now()),
    status: () => {},
    json: () => {},
    setHeader: () => {}
  };

  beforeEach(() => {
    req.body = {};
  });

  context('adjustXmlStatus', () => {
    it('should return 400 if status is missing', async () => {
      req.body = { text: validId1 };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ message: 'Status is required' });

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 400 if both text and filename are missing', async () => {
      req.body = { status: 'Curated' };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ message: 'Either text or filename is required' });

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 400 if both text and filename are provided', async () => {
      req.body = { status: 'Curated', text: validId1, filename: 'test.txt' };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returns({ message: 'Provide either text or filename, not both' });

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should report invalid ObjectIds', async () => {
      req.body = { status: 'Curated', text: `${validId1},not-a-valid-id` };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XmlData, 'updateMany').resolves({ modifiedCount: 1 });
      sinon.stub(XmlData, 'find').resolves([{ _id: validId1 }]);

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(200)).to.be.true;
      const jsonArg = res.json.firstCall.args[0];
      expect(jsonArg.data.invalidIds).to.include('not-a-valid-id');
      expect(jsonArg.data.xmlDataUpdated).to.equal(1);
    });

    it('should update xmldata records with text input', async () => {
      req.body = { status: 'Curated', text: `${validId1},${validId2}` };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XmlData, 'updateMany').resolves({ modifiedCount: 2 });
      sinon.stub(XmlData, 'find').resolves([{ _id: validId1 }, { _id: validId2 }]);

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(200)).to.be.true;
      const jsonArg = res.json.firstCall.args[0];
      expect(jsonArg.data.xmlDataUpdated).to.equal(2);
      expect(jsonArg.data.curatedSamplesUpdated).to.equal(0);
      expect(jsonArg.data.failed).to.have.lengthOf(0);
    });

    it('should fall through to curatedsamples for IDs not found in xmldata', async () => {
      req.body = { status: 'Curated', text: `${validId1},${validId2},${validId3}` };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(XmlData, 'updateMany').resolves({ modifiedCount: 1 });
      sinon.stub(XmlData, 'find').resolves([{ _id: validId1 }]);
      sinon.stub(CuratedSample, 'updateMany').resolves({ modifiedCount: 1 });
      sinon.stub(CuratedSample, 'find').resolves([{ _id: validId2 }]);

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(200)).to.be.true;
      const jsonArg = res.json.firstCall.args[0];
      expect(jsonArg.data.xmlDataUpdated).to.equal(1);
      expect(jsonArg.data.curatedSamplesUpdated).to.equal(1);
      expect(jsonArg.data.failed).to.include(validId3);
    });

    it('should read IDs from file and delete file after processing', async () => {
      req.body = { status: 'Curated', filename: 'ids.txt' };
      sinon.stub(res, 'status').returnsThis();
      sinon.stub(res, 'json').returnsThis();
      sinon.stub(fs, 'readFileSync').returns(`${validId1}\n${validId2}\n`);
      sinon.stub(XmlData, 'updateMany').resolves({ modifiedCount: 2 });
      sinon.stub(XmlData, 'find').resolves([{ _id: validId1 }, { _id: validId2 }]);
      const deleteStub = sinon.stub(FileManager, 'deleteFile');

      await JobsController.adjustXmlStatus(req, res, next);

      expect(res.status.calledWith(200)).to.be.true;
      expect(deleteStub.calledOnce).to.be.true;
      const jsonArg = res.json.firstCall.args[0];
      expect(jsonArg.data.xmlDataUpdated).to.equal(2);
    });

    it('should call next with error on DB failure', async () => {
      req.body = { status: 'Curated', text: validId1 };
      sinon.stub(XmlData, 'updateMany').rejects(new Error('DB error'));
      const nextSpy = sinon.spy();

      await JobsController.adjustXmlStatus(req, res, nextSpy);

      expect(nextSpy.calledOnce).to.be.true;
      const err = nextSpy.firstCall.args[0];
      expect(err).to.have.property('statusCode', 500);
    });
  });
});
