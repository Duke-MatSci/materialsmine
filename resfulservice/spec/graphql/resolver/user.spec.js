/* eslint-disable no-undef */
const { expect } = require('chai');
const graphQlSchema = require('../../../src/graphql/typeDefs');
const { createUser } = require('../../../src/graphql/resolver/mutation');

describe('Resolver Unit Tests:', function () {
  it('should have createUser(...) as a Mutation resolver', async function () {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.name).to.equal('createUser');
  });

  it('should have the correct param datatypes for createUser(...) mutation resolver', () => {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.args.length).to.eq(1, `createUser mutation expected 1 params but got ${createUser.args.length}`);

    const { alias, userid, givenName, surName, displayName, email, key } = createUser.args[0].type.getFields();

    expect(alias.type.toString()).to.equal('String!');
    expect(userid.type.toString()).to.equal('String!');
    expect(givenName.type.toString()).to.equal('String!');
    expect(surName.type.toString()).to.equal('String!');
    expect(displayName.type.toString()).to.equal('String!');
    expect(email.type.toString()).to.equal('String!');
    expect(key.type.toString()).to.equal('String!');
  });

  it.skip('createUser', async () => {
    const user = await createUser(
      {},
      {input: {surName: 'surName', alias: 'alias', displayName: 'displayName', email: 'gmail88@email.com', givenName: 'givenName', key: 'key', userid: 'userid'}},
      {req: {logger: {info: (message) => {}}}, isAuthenticated: true}
    );
    console.log(user);
  });

  it('should return User! datatype for createUser(...) mutation', () => {
    const {createUser} = graphQlSchema.getMutationType().getFields();
    expect(createUser.type.toString()).to.equal('User!');
  });
});