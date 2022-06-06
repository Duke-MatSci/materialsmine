const {expect} = require('chai');
const graphQlSchema = require('../../../src/graphql/typeDefs');

describe('Schema Unit Tests:', function () {
  it('should have Query name as schema query type', async function () {
    const schemaQuery = graphQlSchema.getQueryType().toString();
    expect(schemaQuery).to.equal('Query');
  });

  it('should have Mutation name as schema mutation type', async function () {
    const schemaMutation = graphQlSchema.getMutationType().toString();
    expect(schemaMutation).to.equal('Mutation');
  });

  it('should have user as a RootQuery field', async function () {
    const {user} = graphQlSchema.getQueryType().getFields();
    expect(user.name).to.equal('user');
    expect(user.type.toString()).to.equal('User!');
  });

  it('should have _id,alias,userid,givenName,surName,displayName,email,apiAccess as fields for User schema', async function () {
    const user = graphQlSchema.getType('User');
    const keys = Object.keys(user.getFields());
    expect(keys).to.include.members(['_id', 'alias', 'userid', 'givenName', 'surName', 'displayName', 'email', 'apiAccess']);
  });

  it('should have correct datatypes for User schema', async function () {
    const user = graphQlSchema.getType('User');
    const {_id, alias, userid, givenName, surName, displayName, email, apiAccess} = user.getFields();

    expect(_id.type.toString()).to.equal('ID');
    expect(alias.type.toString()).to.equal('String');
    expect(userid.type.toString()).to.equal('String');
    expect(givenName.type.toString()).to.equal('String');
    expect(surName.type.toString()).to.equal('String');
    expect(displayName.type.toString()).to.equal('String');
    expect(email.type.toString()).to.equal('String');
    expect(apiAccess.type.toString()).to.equal('String');
  });
});