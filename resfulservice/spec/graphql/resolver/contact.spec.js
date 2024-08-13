const chai = require('chai');
const sinon = require('sinon');
const Contact = require('../../../src/models/contact');
const graphQlSchema = require('../../../src/graphql');
const {
  mockContact,
  mockUserContact,
  mockUpdatedContact
} = require('../../mocks');
const {
  Mutation: { submitContact, updateContact },
  Query: { getUserContacts, contacts }
} = require('../../../src/graphql/resolver');
const { userRoles } = require('../../../config/constant');
const FileController = require('../../../src/controllers/fileController');

const { expect } = chai;

describe('Contact Resolver Unit Tests:', function () {
  afterEach(() => sinon.restore());

  this.timeout(10000);

  const input = {
    contactId: 'akdn9wqkn',
    resolved: mockUpdatedContact.resolved,
    response: mockUpdatedContact.response
  };

  const req = { logger: { info: (_message) => {}, error: (_message) => {} } };

  context('submitContact', () => {
    it('should have createContact(...) as a Mutation resolver', async function () {
      const { submitContact } = graphQlSchema.getMutationType().getFields();
      expect(submitContact.name).to.equal('submitContact');
      expect(submitContact.type.toString()).to.equal('Contact!');
    });

    it('should save new contact information', async () => {
      sinon
        .stub(Contact.prototype, 'save')
        .callsFake(() => ({ ...mockContact, _id: 'akdn9wqkn' }));

      const contact = await submitContact({}, { input }, { req });

      expect(contact).to.have.property('email');
    });

    it('should throw a 500 error', async () => {
      sinon.stub(Contact.prototype, 'save').throws();

      const result = await submitContact({}, { input }, { req });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });

  context('updateContact', () => {
    it('should update a contact', async function () {
      sinon.stub(Contact, 'findOne').returns(mockContact);
      sinon.stub(Contact, 'findOneAndUpdate').returns(mockUpdatedContact);
      sinon.stub(FileController, 'deleteFile').returns(true);

      const contact = await updateContact(
        {},
        { input: { ...input } },
        { req, user: { roles: userRoles.isAdmin }, isAuthenticated: true }
      );
      expect(contact).to.have.property('email');
      expect(contact).to.have.property('resolved');
      expect(contact).to.have.property('response');
      expect(contact.resolved).to.equal(true);
    });

    it('should throw a 401, not authenticated error', async () => {
      const error = await updateContact(
        {},
        { input },
        { req, user: { isAdmin: false }, isAuthenticated: false }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should throw a 404, not authenticated error', async () => {
      sinon.stub(Contact, 'findOne').returns(null);

      const error = await updateContact(
        {},
        { input },
        { req, user: { roles: userRoles.isAdmin }, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('should throw a 500 error', async () => {
      sinon.stub(Contact, 'findOne').throws();

      const result = await updateContact(
        {},
        { input },
        { req, user: { roles: userRoles.isAdmin }, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });

  context('getUserContacts', () => {
    it("should return paginated lists of a user's contacts", async () => {
      sinon.stub(Contact, 'countDocuments').returns(1);
      sinon.stub(Contact, 'find').returns(mockUserContact);
      sinon.stub(mockUserContact, 'lean').returnsThis();

      const userContacts = await getUserContacts(
        {},
        { input },
        { req, isAuthenticated: true }
      );

      expect(userContacts).to.have.property('data');
      expect(userContacts.totalItems).to.equal(1);
    });

    it('should throw a 401, not authenticated error', async () => {
      const error = await getUserContacts(
        {},
        { input },
        { req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Contact, 'countDocuments').throws();

      const result = await getUserContacts(
        {},
        { input },
        { req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });

  context('contacts', () => {
    it('should throw a 401, not authenticated error', async () => {
      const error = await contacts(
        {},
        { input },
        { req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Contact, 'countDocuments').returns(1);
      sinon.stub(Contact, 'find').throws();

      const result = await contacts(
        {},
        { input },
        { req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401);
    });
  });
});
