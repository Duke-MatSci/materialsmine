const chai = require('chai');
const sinon = require('sinon');
const Contact = require('../../../src/models/contact')
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { submitContact }, Query: { getUserContacts, contacts } } = require('../../../src/graphql/resolver');
const { mongoConn } = require("../../utils/mongo");

const { expect } = chai;

mongoConn();
const mockContact = {
  fullName: 'test user',
  email: 'test@example.com',
  purpose: 'QUESTION',
  message: 'test message'
}

describe('Contact Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const input = {
    ...mockContact
  }

  const req = { logger: { info: (_message) => { }, error: (_message) => { } } }

  context('submitContact', () => {
    it('should have createContact(...) as a Mutation resolver', async function () {
      const { submitContact } = graphQlSchema.getMutationType().getFields();
      expect(submitContact.name).to.equal('submitContact');
      expect(submitContact.type.toString()).to.equal('Contact!');
    });

    it('should save new contact information', async () => {
      sinon.stub(Contact.prototype, 'save').callsFake(() => ({...input, _id: 'akdn9wqkn'}))

      const contact = await submitContact({}, { input }, { req });

      expect(contact).to.have.property('email');
    });

    it('should throw a 500 error', async () => {
      sinon.stub(Contact.prototype, 'save').throws();

      const result = await submitContact({}, { input }, { req });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });
  })

  context('getUserContacts', () => {
    const mockUserContact = {
      _id: 'akdn9wqkn',
      fullName: 'test user',
      email: 'test@example.com',
      purpose: 'QUESTION',
      message: 'test message',
      lean: () => this
    }

    it("should return paginated lists of a user's contacts", async () => {
      sinon.stub(Contact, 'countDocuments').returns(1);
      sinon.stub(Contact, 'find').returns(mockUserContact);
      sinon.stub(mockUserContact, 'lean').returnsThis();

      const userContacts = await getUserContacts({}, { input }, { req, isAuthenticated: true });

      expect(userContacts).to.have.property('data');
      expect(userContacts.totalItems).to.equal(1);
    });

    it("should throw a 401, not authenticated error", async () => {

      const error = await getUserContacts({}, { input }, { req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Contact, 'countDocuments').throws();

      const result = await getUserContacts({}, { input }, { req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });
  })


  context('contacts', () => {
    it('should return paginated lists of contacts', async () => {
      const mockContact = {
        _id: 'akdn9wqkn',
        fullName: 'test user',
        email: 'test@example.com',
        purpose: 'QUESTION',
        message: 'test message',
        skip: () => ({_id: 'akdn9wqkn', ...input }),
        lean: () => ({_id: 'akdn9wqkn', ...input }),
        limit: () => ({_id: 'akdn9wqkn', ...input })
      }
      sinon.stub(Contact, 'countDocuments').returns(1);
      sinon.stub(Contact, 'find').returns(mockContact);
      sinon.stub(mockContact, 'skip').returnsThis();
      sinon.stub(mockContact, 'limit').returnsThis();
      sinon.stub(mockContact, 'lean').returnsThis();

      const allContacts = await contacts({}, { input, pageNumber: 1, pageSize: 1 }, { req, isAuthenticated: true });
      expect(allContacts).to.have.property('data');
      expect(allContacts.totalItems).to.equal(1);
    });

    it("should throw a 401, not authenticated error", async () => {

      const error = await contacts({}, { input }, { req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Contact, 'countDocuments').returns(1);
      sinon.stub(Contact, 'find').throws()

      const result = await contacts({}, { input }, { req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });
  })
}); 