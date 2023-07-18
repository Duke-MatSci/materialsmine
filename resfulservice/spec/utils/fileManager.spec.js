const { expect } = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const { mockDownloadStream, mockFileLstat, mockDirectoryLstat } = require('../mocks');
const { logger } = require('../common/utils');
const { deleteFile, findFile, deleteFolder } = require('../../src/utils/fileManager');

describe('FileManager Utils', function () {
  afterEach(() => sinon.restore());

  const req = { 
    logger,
    env: {
      FILES_DIRECTORY: 'files-directory'
    },
    params: {
      fileId: 'bulk-curation-1689354647298/001.tif'
    }
  }


  context('deleteFile', () => {
    it('creates logger', async function () {
      const req = { logger: { info: sinon.spy() }}
      const deleteStub = sinon.stub(fs, 'unlink').callsFake(function (filePath, cb) {
        cb(null)
      })
      deleteFile('/images/jpeg', req);
      sinon.assert.called(deleteStub);
    });
  })

  context('deleteFolder', () => {
    it('creates logger', async function () {
      const req = { logger: { info: sinon.spy() }}
      const deleteStub = sinon.stub(fs, 'rm').callsFake(function (filePath, { recursive, force }, cb) {
        cb(null)
      })
      deleteFolder('/images', req);
      sinon.assert.called(deleteStub);
    });
  })

  context('findFile', () => {
    it('should return null if fileId is in a nested directory but does not exists', async () => {
      sinon.stub(fs, 'existsSync').returns(false);
      const result = await findFile(req);
      expect(result).to.equals(null);
    });

    it('should return a fileStream if fileId is in a nested directory and exists', async () => {
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'createReadStream').returns(mockDownloadStream)
      const result = await findFile(req);
      expect(result).to.have.property('pipe');
    });

    it('should return null if no files in the directory and fileId is not full path', async () => {
      req.params.fileId = '001.tif';
      sinon.stub(fs.promises, 'readdir').returns([]);
      const result = await findFile(req);
      expect(result).to.equals(null);
    });

    it('should return file if files is found in the root directory and fileId is not full path', async () => {
      req.params.fileId = '001.tif';
      sinon.stub(fs.promises, 'readdir').returns(['001.tif']);
      sinon.stub(fs.promises, 'lstat').returns(mockFileLstat)
      sinon.stub(fs, 'createReadStream').returns(mockDownloadStream)
      const result = await findFile(req);
      expect(result).to.have.property('pipe');
    });

    it('should return file if files is found in the nested directory and fileId is not full path', async () => {
      req.params.fileId = '001.tif';
      const readFolderStub = sinon.stub(fs.promises, 'readdir')
      readFolderStub.onFirstCall().returns(['bulk-curation-1689354647298']);
      readFolderStub.onSecondCall().returns(['001.tif']);
      const lstatStub = sinon.stub(fs.promises, 'lstat');
      lstatStub.onFirstCall().returns(mockDirectoryLstat);
      lstatStub.onSecondCall().returns(mockFileLstat);
      sinon.stub(fs, 'createReadStream').returns(mockDownloadStream)
      const result = await findFile(req);
      expect(result).to.have.property('pipe');
    });

    it('should return null if file is not found in nested directory and fileId is not full path', async () => {
      req.params.fileId = '001.tif';
      const readFolderStub = sinon.stub(fs.promises, 'readdir')
      readFolderStub.onFirstCall().returns(['bulk-curation-1689354647298']);
      readFolderStub.onSecondCall().returns([]);
      const lstatStub = sinon.stub(fs.promises, 'lstat');
      lstatStub.onFirstCall().returns(mockDirectoryLstat);
      const result = await findFile(req);
      expect(result).to.equals(null);
    });

    it('should return null if FILES_DIRECTORY env variable is not set', async function () {
      req.env.FILES_DIRECTORY = undefined
      const result = await findFile(req);
      expect(result).to.equals(null);
    });
  })
});
