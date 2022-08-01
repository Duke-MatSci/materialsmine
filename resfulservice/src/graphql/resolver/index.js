const userQuery = require('./user/query');
const imageExplorerQuery = require('./imageExplorer/query');
const contactQuery = require('./contact/query');
const userMutation = require('./user/mutation');
const apiAccessMutation = require('./apiAccess/mutation');
const contactMutation = require('./contact/mutation');

const resolvers = {
  Query: Object.assign({}, userQuery, imageExplorerQuery, contactQuery),
  Mutation: Object.assign({}, userMutation, apiAccessMutation, contactMutation)
};

module.exports = resolvers;
