const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const { mockDownloadStream, mockFileLstat, mockDirectoryLstat } = require('../mocks');
const { logger } = require('../common/utils');
const { deleteFile, findFile, deleteFolder, getFileExtension, writeFile, readFile } = require('../../src/utils/fileManager');

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
    it('should delete file', async function () {
      const req = { logger: { info: sinon.spy() }}
      const deleteStub = sinon.stub(fs, 'unlink').callsFake(function (filePath, cb) {
        cb(null)
      })
      deleteFile('/images/jpeg', req);
      sinon.assert.called(deleteStub);
    });
  })

  context('deleteFolder', () => {
    it('should delete a folder', async function () {
      const req = { logger: { info: sinon.spy() }}
      const deleteStub = sinon.stub(fs, 'rm').callsFake(function (filePath, { recursive, force }, cb) {
        cb(null)
      })
      deleteFolder('/images', req);
      sinon.assert.called(deleteStub);
    });
  })

  context('findFile', () => {
    it('should return null if FILES_DIRECTORY env variable is not set', async function () {
      const req = { env: { }, params: { fileId: undefined }}
      try {
        const result = await findFile(req); 
      } catch (error) {
        expect(error.message).to.equals('Internal Server Error');
      }
    });
    
    it('should return null if no files in the directory and fileId is not full path', async () => {
      sinon.stub(fs.promises, 'readdir').returns([]);
      try {
        await findFile(req);
      } catch (error) {
        expect(error.message).to.equals('File not found');
      }
    });

    it('should return file if files is found in the root directory and fileId is not full path', async () => {
      sinon.stub(fs.promises, 'readdir').returns(['001.tif']);
      sinon.stub(fs.promises, 'lstat').returns(mockFileLstat)
      sinon.stub(fs, 'createReadStream').returns(mockDownloadStream)
      const result = await findFile(req);
      expect(result).to.have.property('ext');
      expect(result).to.have.property('fileStream');
    });

    it('should return file if files is found in the nested directory and fileId is not full path', async () => {
      const readFolderStub = sinon.stub(fs.promises, 'readdir')
      readFolderStub.onFirstCall().returns(['bulk-curation-1689354647298']);
      readFolderStub.onSecondCall().returns(['001.tif']);
      const lstatStub = sinon.stub(fs.promises, 'lstat');
      lstatStub.onFirstCall().returns(mockDirectoryLstat);
      lstatStub.onSecondCall().returns(mockFileLstat);
      sinon.stub(fs, 'createReadStream').returns(mockDownloadStream)
      const result = await findFile(req);
      expect(result).to.have.property('ext');
      expect(result).to.have.property('fileStream');
    });

    it('should return null if file is not found in nested directory and fileId is not full path', async () => {
      const readFolderStub = sinon.stub(fs.promises, 'readdir')
      readFolderStub.onFirstCall().returns(['bulk-curation-1689354647298']);
      readFolderStub.onSecondCall().returns([]);
      const lstatStub = sinon.stub(fs.promises, 'lstat');
      lstatStub.onFirstCall().returns(mockDirectoryLstat);
      try {
        await findFile(req);
      } catch (error) {
        expect(error.message).to.equals('File not found');
      }
    });
  })

  context('getFileExtension', () => {
    it('should return the file extension', () => {
      sinon.stub(path, 'parse').returns('.tiff');
      const ext = getFileExtension('001.tiff');
      expect(ext).to.equals('.tiff');
    })
  })
});
