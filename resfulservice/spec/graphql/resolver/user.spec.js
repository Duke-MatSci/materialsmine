const chai = require('chai');
const sinon = require('sinon');
const User = require('../../../src/models/user')
const {
  Mutation: { updateUser, deleteUser },
  Query: { verifyUser, users, user } 
} = require('../../../src/graphql/resolver');
const { mockUser, mockDBUser } = require('../../mocks');
const { userRoles } = require('../../../config/constant');

const { expect } = chai;

describe('User Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const req = {
    headers: { authorization: '9a4kn90van490aoi4q90' },
    logger: { info: (message) => { }, error: (message) => { } } 
  }

  const input = {
    ...mockUser
  }

  context('verifyUser', () => {
    it('Should return verified user and token', () => {
      const verifiedUser = verifyUser({}, { }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true });
      expect(verifiedUser).to.have.property('isAuth');
      expect(verifiedUser).to.have.property('token')
    });

    it("Should throw a 401, not authenticated error", () => {
      const error = verifyUser({}, { }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });
  });

  context('updateUser', () => {
    it("should throw a 401, not authenticated error", async () => {

      const error = await  updateUser({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("should throw a 404, not found error", async () => {
      sinon.stub(User, 'findOneAndUpdate').returns(null);
      const error = await  updateUser({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it("should throw a 409, forbidden error", async () => {
      const error = await  updateUser(
        {},
        { input: { ...input, roles: userRoles.isAdmin } },
        { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }
      ); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(409);
    });

    it("should throw a 500, server error", async () => {
      sinon.stub(User, 'findOneAndUpdate').throws(null);
      const error = await  updateUser({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });

    it('should update user information if user is registered', async () => {
      
      sinon.stub(User, 'findOneAndUpdate').returns({ _id: 'kas2344nlkla', ...mockUser });
      const updatedUser = await updateUser(
        {},
        { input: {...input, _id: 'kas2344nlkla'} },
        { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }
      );
  
      expect(updatedUser).to.have.property('_id');
      expect(updatedUser._id).to.equal('kas2344nlkla');
    });
  });

  context('user', () => {
    it("Should throw a 401, not authenticated error", async () => {

      const error = await  user({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("Should throw a 404, not found error", async () => {
      sinon.stub(User, 'findOne').returns(null);
      const error = await  user({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('Should return a user if they are registered', async () => {

      sinon.stub(User, 'findOne').returns(mockDBUser)

      const dbUser = await user({}, { input: {...input, _id: 'kas2344nlkla'} }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true });

      expect(dbUser).to.have.property('_id');
      expect(dbUser._id).to.equal('kas2344nlkla');
    });

    it("Should throw a 500, server error", async () => {
      sinon.stub(User, 'findOne').throws();
      const error = await  user({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  })

  context('users', () => {
    it("Should throw a 401, not authenticated error", async () => {

      const error = await  users({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('Should return a paginated list of users when input is provided', async () => {
      
      sinon.stub(User, 'countDocuments').returns(1);
      sinon.stub(User, 'find').returns(mockDBUser);
      sinon.stub(mockDBUser, 'skip').returnsThis();
      sinon.stub(mockDBUser, 'limit').returnsThis();
      sinon.stub(mockDBUser, 'lean').returnsThis();
      
      const allUsers = await users({}, { input: { pageNumber: 1, pageSize: 1  }}, { req, isAuthenticated: true });
      expect(allUsers).to.have.property('data');
      expect(allUsers.totalItems).to.equal(1);
    });

    it('Should return a paginated list of users when input is not provided', async () => {
      
      sinon.stub(User, 'countDocuments').returns(1);
      sinon.stub(User, 'find').returns(mockDBUser);
      sinon.stub(mockDBUser, 'skip').returnsThis();
      sinon.stub(mockDBUser, 'limit').returnsThis();
      sinon.stub(mockDBUser, 'lean').returnsThis();
      
      const allUsers = await users({}, { }, { req, isAuthenticated: true });
      expect(allUsers).to.have.property('data');
      expect(allUsers.totalItems).to.equal(1);
    });

    it("Should throw a 500, server error", async () => {
      sinon.stub(User, 'countDocuments').throws();
      const error = await  users({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('deleteUser', () => {
    it("Should throw a 401, not authenticated error", async () => {

      const error = await  deleteUser({}, { input }, { user: { _id: 'kas2344nlkla' }, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("should throw a 409, forbidden error if user is not admin", async () => {
      const error = await  deleteUser({}, { input }, { user: { _id: 'kas2344nlkla', roles: 'member' }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(409);
    });

    it("Should throw a 500, server error on DB error", async () => {
      sinon.stub(User, 'deleteMany').throws();
      const error = await  deleteUser({}, { input }, { user: { _id: 'kas2344nlkla', roles: userRoles.isAdmin }, req, isAuthenticated: true }); 
      
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });

    it('Should delete users if it exist in DB', async () => {
      sinon.stub(User, 'deleteMany').returns({ acknowledged: true, deletedCount: 1 });
      const deletedUser = await deleteUser({}, { input: {...input, ids: ['kas2344nlkla']} }, { user: { _id: 'kas2344nlkla', roles: userRoles.isAdmin }, req, isAuthenticated: true });
  
      expect(deletedUser).to.be.equal(true);
      
    })
  })
});
