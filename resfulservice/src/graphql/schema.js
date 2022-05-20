const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type User {
    _id: ID!
    name: String!
    email: String!
    status: String!
  }

  type RootQuery {
    user: User!
  }

  type RootMutation {
    updateStatus(status: String!): User!
  }

  type SubmittedJob {
    id: ID!
    jobName: String
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
