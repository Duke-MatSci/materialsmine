const curation = require('./curationMock');
const user = require('./userMock');
const files = require('./fileMock');
const tasks = require('./taskMock');
const graphql = require('./graphqlMock');

// It is re-useable across all tests files
const next = function (fn) {
  return fn;
};

module.exports = {
  ...curation,
  ...user,
  ...files,
  ...tasks,
  ...graphql,
  next
};
