const curation = require('./curationMock');
const user = require('./userMock');

module.exports = {
  ...curation,
  ...user
};
