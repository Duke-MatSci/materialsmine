const sinon = require('sinon');

const mockFiles = [[{ path: '/images/cat.png' }, { path: '/images/dog.png' }]];

const mockDownloadStream = {
  pipe: sinon.spy()
};

const mockEmptyStream = {
  pipe: sinon.spy()
};

const mockFSFiles = {
  files: mockFiles,
  limit: sinon.stub().returnsThis()
};

const mockBucket = {
  openDownloadStream: sinon.stub().returns(mockDownloadStream),
  find: sinon.stub().returnsThis(),
  limit: sinon.stub().returnsThis(),
  toArray: sinon.stub().returns(mockFiles)
};

const mockFindObjectStream = {
  on: sinon.stub().callsFake(function (filePath, cb) {
    cb(new Error(), { name: 'code.png' });
  })
};

const mockFileLstat = {
  isDirectory: (path) => false,
  isFile: (path) => true
};

const mockDirectoryLstat = {
  isDirectory: (path) => true,
  isFile: (path) => false
};

module.exports = {
  mockBucket,
  mockFiles,
  mockFSFiles,
  mockDownloadStream,
  mockEmptyStream,
  mockFindObjectStream,
  mockFileLstat,
  mockDirectoryLstat
};
