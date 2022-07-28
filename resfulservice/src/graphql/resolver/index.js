const userQuery = require('./user/query');
const imageExplorerQuery = require('./imageExplorer/query');
const userMutation = require('./user/mutation');
const apiAccessMutation = require('./apiAccess/mutation');

const resolvers = {
  Query: Object.assign({}, userQuery, imageExplorerQuery),
  Mutation: Object.assign({}, userMutation, apiAccessMutation)
};

module.exports = resolvers;
