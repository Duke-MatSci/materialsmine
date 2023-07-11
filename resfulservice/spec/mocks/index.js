const curation = require('./curationMock');
const user = require('./userMock');

// It is re-useable across all tests files
const next = function (fn) {
  return fn;
};

module.exports = {
  ...curation,
  ...user,
  next
};
