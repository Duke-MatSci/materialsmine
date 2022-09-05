const { expect } = require('chai');
const graphQlSchema = require('../../../src/graphql');

describe('Schema Unit Tests:', function () {
  it('should have Query name as schema query type', async function () {
    const schemaQuery = graphQlSchema.getQueryType().toString();
    expect(schemaQuery).to.equal('Query');
  });

  it('should have Mutation name as schema mutation type', async function () {
    const schemaMutation = graphQlSchema.getMutationType().toString();
    expect(schemaMutation).to.equal('Mutation');
  });

  it('should have getSingleContact as a RootQuery field', async function () {
    const { getUserContacts } = graphQlSchema.getQueryType().getFields();
    expect(getUserContacts.name).to.equal('getUserContacts');
    expect(getUserContacts.type.toString()).to.equal('Contacts!');
  });

  it('should have contacts as a RootQuery field', async function () {
    const { contacts } = graphQlSchema.getQueryType().getFields();
    expect(contacts.name).to.equal('contacts');
    expect(contacts.type.toString()).to.equal('Contacts!');
  });

  it('should have _id,fullName,email,purpose,message Contact schema', async function () {
    const contact = graphQlSchema.getType('Contact');
    const keys = Object.keys(contact.getFields());
    expect(keys).to.include.members(['_id', 'fullName', 'email', 'purpose', 'message']);
  });

  it('should have correct datatypes for Contact schema', async function () {
    const contact = graphQlSchema.getType('Contact');
    const { _id, fullName, email, purpose, message } = contact.getFields();

    expect(_id.type.toString()).to.equal('ID');
    expect(fullName.type.toString()).to.equal('String!');
    expect(email.type.toString()).to.equal('String!');
    expect(purpose.type.toString()).to.equal('Purpose!');
    expect(message.type.toString()).to.equal('String!');
  });
}); 