const userQuery = require('./user/query');
const imageExplorerQuery = require('./imageExplorer/query');
const contactQuery = require('./contact/query');
const userMutation = require('./user/mutation');
const apiAccessMutation = require('./apiAccess/mutation');
const contactMutation = require('./contact/mutation');
const datasetMutation = require('./dataset/mutation');
const datasetQuery = require('./dataset/query');
const pixelatedDataExplorerQuery = require('./pixelated/query');
const materialMutation = require('./material_template/mutation');
const materialQuery = require('./material_template/query');
const { filesetsUnionResolveType } = require('./dataset/field-resolver');

const resolvers = {
  Query: Object.assign({}, userQuery, imageExplorerQuery, contactQuery, datasetQuery, pixelatedDataExplorerQuery, materialQuery),
  Mutation: Object.assign({}, userMutation, apiAccessMutation, contactMutation, datasetMutation, materialMutation),
  Filesets: { __resolveType: filesetsUnionResolveType }
};

module.exports = resolvers;
