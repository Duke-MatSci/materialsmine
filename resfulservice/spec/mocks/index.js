const curation = require('./curationMock');
const user = require('./userMock');
const files = require('./fileMock');

// It is re-useable across all tests files
const next = function (fn) {
  return fn;
};

module.exports = {
  ...curation,
  ...user,
  ...files,
  next
};
