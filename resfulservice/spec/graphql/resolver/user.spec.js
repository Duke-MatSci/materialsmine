const chai = require('chai');
const sinon = require('sinon');
const User = require('../../../src/models/user')
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { createUser } } = require('../../../src/graphql/resolver');

const { expect } = chai;

// const mockUser = {
//   alias: "testAlias",
//   givenName: "testName",
//   surName: "testSurname",
//   displayName: "testDisplayName",
//   email: "test@example.com"
// }

describe('User Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const input = {
    surName: 'surName', alias: 'alias', displayName: 'displayName', email: 'gmail88@email.com', givenName: 'givenName', key: 'key'
  }

  const req = { logger: { info: (_message) => { } } }

  it('should have createUser(...) as a Mutation resolver', async function () {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.name).to.equal('createUser');
  });

  it('createUser', async () => {
    sinon.stub(User, 'countDocuments').returns(0);
    sinon.stub(User.prototype, 'save').callsFake(() => ({...input, _id: 'b39ak9qna'}))
    const user = await createUser({}, { input }, { req });

    expect(user).to.have.property('_id');
  });

  it('should return User! datatype for createUser(...) mutation', () => {
    const { createUser } = graphQlSchema.getMutationType().getFields();
    expect(createUser.type.toString()).to.equal('User!');
  });
});