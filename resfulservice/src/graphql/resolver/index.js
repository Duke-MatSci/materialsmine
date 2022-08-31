const userQuery = require('./user/query');
const imageExplorerQuery = require('./imageExplorer/query');
const contactQuery = require('./contact/query');
const userMutation = require('./user/mutation');
const apiAccessMutation = require('./apiAccess/mutation');
const contactMutation = require('./contact/mutation');
const datasetMutation = require('./dataset/mutation');
const datasetQuery = require('./dataset/query');
const pixelatedDataExplorerQuery = require('./pixelated/query');
// const { filesets, files, user } = require('./dataset/field-resolver');

const resolvers = {
  Query: Object.assign({}, userQuery, imageExplorerQuery, contactQuery, datasetQuery, pixelatedDataExplorerQuery),
  Mutation: Object.assign({}, userMutation, apiAccessMutation, contactMutation, datasetMutation)
  // Dataset: { filesets, user },
  // Fileset: { files }
};

module.exports = resolvers;
