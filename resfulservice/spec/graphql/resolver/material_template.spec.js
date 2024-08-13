const chai = require('chai');
const sinon = require('sinon');
const MaterialTemplate = require('../../../src/models/xlsxCurationList');
const graphQlSchema = require('../../../src/graphql');
const {
  Mutation: {
    createXlsxCurationList,
    updateXlsxCurationList,
    deleteXlsxCurationList
  },
  Query: { getXlsxCurationList }
} = require('../../../src/graphql/resolver');
const {
  user,
  mockColumnsInput,
  mockColumn,
  mockDBColumn,
  mockConflictError
} = require('../../mocks');

const { expect } = chai;

describe('Material Template Resolver Unit Tests:', function () {
  afterEach(() => sinon.restore());

  const req = { logger: { info: (message) => {}, error: (message) => {} } };

  context('createXlsxCurationList', () => {
    const input = {
      ...mockColumnsInput
    };

    it('should have createXlsxCurationList(...) as a Mutation resolver', async function () {
      const { createXlsxCurationList } = graphQlSchema
        .getMutationType()
        .getFields();
      expect(createXlsxCurationList.name).to.equal('createXlsxCurationList');
    });

    it('should create new material colums', async () => {
      sinon.stub(MaterialTemplate, 'insertMany').returns(true);
      // sinon.stub(MaterialTemplate.prototype, 'save').callsFake(() => ({...input, _id: 'b39ak9qna'}))
      const columns = await createXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(columns).to.have.property('columns');
    });

    it('should return a 401 unauthenticated error', async () => {
      const result = await createXlsxCurationList(
        {},
        { input: {} },
        { user, req, isAuthenticated: false }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401);
    });

    it('should return a 409 conflict error', async () => {
      sinon.stub(MaterialTemplate, 'insertMany').throws(mockConflictError);
      const result = await createXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(409);
    });

    it('should return MaterialColumns!! datatype for createXlsxCurationList(...) mutation', () => {
      const { createXlsxCurationList } = graphQlSchema
        .getMutationType()
        .getFields();
      expect(createXlsxCurationList.type.toString()).to.equal(
        'MaterialColumns!'
      );
    });
  });

  context('updateXlsxCurationList', () => {
    const input = { ...mockColumn };
    it('should throw a 401, not authenticated error', async () => {
      const error = await updateXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("should return a 404 error if column doesn't exist", async () => {
      sinon.stub(MaterialTemplate, 'findOneAndUpdate').returns(null);
      const error = await updateXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('should update column if column exists', async () => {
      sinon
        .stub(MaterialTemplate, 'findOneAndUpdate')
        .returns({ ...mockDBColumn, ...input, user });

      const result = await updateXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('field');
      expect(result).to.have.property('values');
    });

    it('should throw a 500, server error', async () => {
      sinon.stub(MaterialTemplate, 'findOneAndUpdate').throws();
      const error = await updateXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('deleteXlsxCurationList', () => {
    const input = { field: mockColumn.field };
    it('should throw a 401, not authenticated error', async () => {
      const error = await deleteXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: false }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it("should return a 404 error if column doesn't exist", async () => {
      sinon.stub(MaterialTemplate, 'findOneAndDelete').returns({
        lean: sinon.stub().returns(null)
      });
      const error = await deleteXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(404);
    });

    it('should delete a curation list', async () => {
      sinon.stub(MaterialTemplate, 'findOneAndDelete').returns({
        lean: sinon.stub().returns(mockDBColumn)
      });
      const result = await deleteXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('field');
      expect(result).to.have.property('values');
    });

    it('should throw a 500, server error', async () => {
      sinon.stub(MaterialTemplate, 'findOneAndDelete').returns({
        lean: sinon.stub().throws()
      });
      const error = await deleteXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });

  context('getXlsxCurationList', () => {
    const input = { pageNumber: 1, pageSize: 10 };
    it('should throw a 401, not authenticated error', async () => {
      const error = await getXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return paginated lists of columns', async () => {
      sinon.stub(MaterialTemplate, 'countDocuments').returns(2);
      sinon.stub(MaterialTemplate, 'find').returns({
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returns(mockColumnsInput.columns)
      });

      const result = await getXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('columns');
      expect(result.columns).to.be.an('Array');
    });

    it('should return paginated lists of columns', async () => {
      const input = { field: mockColumn.field };
      sinon.stub(MaterialTemplate, 'countDocuments').returns(2);
      sinon.stub(MaterialTemplate, 'find').returns({
        limit: sinon.stub().returnsThis(),
        skip: sinon.stub().returns(mockColumnsInput.columns)
      });

      const result = await getXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('columns');
      expect(result.columns).to.be.an('Array');
    });

    it('should throw a 500, server error', async () => {
      sinon.stub(MaterialTemplate, 'countDocuments').returns(2);
      sinon.stub(MaterialTemplate, 'find').throws();
      const error = await getXlsxCurationList(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(500);
    });
  });
});
