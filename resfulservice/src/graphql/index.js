const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./schema');
const graphqlResolver = require('./resolvers');

const mmGraphQL = graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  formatError (err) {
    if (!err.originalError) {
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'An error occurred.';
    const code = err.originalError.code || 500;
    return { message: message, status: code, data: data };
  }
});

module.exports = mmGraphQL;
