const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type User {
    _id: ID!
  }
  type RootQuery {
    user: User!
  }
  schema {
    query: RootQuery
  }
`);
