const chai = require('chai');
const mongoose = require('mongoose');
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { createUser } } = require('../../../src/graphql/resolver');
const { mongoConn } = require("../../utils/mongo")


const { expect } = chai;
mongoConn();

describe('Resolver Unit Tests:', function () {
  this.timeout(10000)

  it('should have createUser(...) as a Mutation resolver', async function () {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.name).to.equal('createUser');
  });

  it.skip('createUser', async () => {
    const user = await createUser({}, {
      input: {
        surName: 'surName', alias: 'alias', displayName: 'displayName', email: 'gmail88@email.com', givenName: 'givenName', key: 'key'
      }
    }, { req: { logger: { info: (message) => { } } } })

    console.log("hellow user", user);
    // console.log(user);
  });

  it('should return User! datatype for createUser(...) mutation', () => {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.type.toString()).to.equal('User!');
  });
});