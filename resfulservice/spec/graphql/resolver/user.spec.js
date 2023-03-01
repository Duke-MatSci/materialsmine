const chai = require('chai');
const sinon = require('sinon');
const User = require('../../../src/models/user')
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { createUser }, Query: { verifyUser } } = require('../../../src/graphql/resolver');

const { expect } = chai;

describe('User Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const req = {
    headers: { authorization: '9a4kn90van490aoi4q90' },
    logger: { info: (message) => { }, error: (message) => { } } 
  }

  const input = {
    surName: 'surName', alias: 'alias', displayName: 'displayName', email: 'gmail88@email.com', givenName: 'givenName', key: 'key'
  }

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

  context('verifyUser', () => {
    it('should return verified user and token', () => {
      const verifiedUser = verifyUser({}, { }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true });
      expect(verifiedUser).to.have.property('isAuth');
      expect(verifiedUser).to.have.property('token')
    });

    it("should throw a 401, not authenticated error", () => {
      const error = verifyUser({}, { }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });
  })
});