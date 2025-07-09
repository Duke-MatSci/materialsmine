const chai = require('chai');
const sinon = require('sinon');
const DatasetId = require('../../../src/models/datasetId');
const Dataset = require('../../../src/models/dataset');
const User = require('../../../src/models/user');
const graphQlSchema = require('../../../src/graphql');
const {
  Mutation: { createDatasetId, createDataset },
  Query: { getUserDataset, getFilesets }
} = require('../../../src/graphql/resolver');
const { user, mockDataset, mockFiles } = require('../../mocks');
const { expect } = chai;

describe('Dataset Resolver Unit Tests:', function () {
  afterEach(() => sinon.restore());

  this.timeout(10000);

  const req = { logger: { info: (message) => {}, error: (message) => {} } };

  context('createDatasetId', () => {
    it('should have createDatasetId(...) as a Mutation resolver', async function () {
      const { createDatasetId } = graphQlSchema.getMutationType().getFields();
      expect(createDatasetId.name).to.equal('createDatasetId');
      expect(createDatasetId.type.toString()).to.equal('Datasets!');
    });

    it('should throw a 401, not authenticated error', async () => {
      const result = await createDatasetId(
        {},
        {},
        { user, req, isAuthenticated: false }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401);
    });

    it('should create a new datasetId', async () => {
      sinon.stub(DatasetId, 'findOne').returns(null);
      sinon.stub(DatasetId.prototype, 'save').callsFake(() => ({
        _id: '62d951cb6981a12d136a0a0d',
        status: 'WORK IN PROGRESS',
        samples: []
      }));

      const datasetId = await createDatasetId(
        {},
        {},
        { user, req, isAuthenticated: true }
      );
      expect(datasetId).to.have.property('datasetGroupId');
    });

    it.skip('should throw a 409, when an unused datasetId exists', async () => {
      sinon.stub(DatasetId, 'findOne').returns({
        _id: '62d951cb6981a12d136a0a0d',
        status: 'WORK IN PROGRESS',
        samples: []
      });
      const result = await createDatasetId(
        {},
        {},
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(409);
    });

    it('should throw a 500 Internal server error when error is thrown', async () => {
      sinon.stub(DatasetId, 'findOne').throws();

      const result = await createDatasetId(
        {},
        {},
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });

    it('should return DatasetId! datatype for createDatasetId(...) mutation', () => {
      const { createDatasetId } = graphQlSchema.getMutationType().getFields();
      expect(createDatasetId.type.toString()).to.equal('Datasets!');
    });
  });

  context('getUserDataset', () => {
    const input = {
      pageNumber: 1,
      pageSize: 10,
      status: 'APPROVED'
    };

    it("should return paginated lists of a user's datasets", async () => {
      sinon.stub(Dataset, 'find').returns(mockDataset);
      sinon.stub(Dataset, 'countDocuments').returns(1);
      sinon.stub(User, 'findOne').returns(user);
      const datasets = await getUserDataset(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );
      expect(datasets).to.have.property('datasets');
      expect(datasets.totalItems).to.equal(1);
    });

    it('should throw a 401, not authenticated error', async () => {
      const error = await getUserDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Dataset, 'find').throws();

      const result = await getUserDataset(
        {},
        { input },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });

  context('getFilesets', () => {
    const mockFilesetAggregate = [
      {
        count: 1,
        filesets: mockDataset.filesets
      }
    ];

    const filesetInput = {
      ...mockFiles,
      pageSize: 10,
      pageNumber: 1
    };
    it('should return file list of a fileset when both datasetId and filesetName are provided', async () => {
      sinon.stub(Dataset, 'aggregate').returns(mockFilesetAggregate);
      //   sinon.stub(mockDataset, 'lean').returnsThis();
      const fileset = await getFilesets(
        {},
        { input: { ...mockFiles, filesetName: 'E109_S2_Huang_2016' } },
        { user, req, isAuthenticated: true }
      );

      expect(fileset).to.have.property('filesetName');
      expect(fileset).to.have.property('files');
      expect(fileset.files).to.be.an('array');
    });

    it('should return file list of a fileset when only datasetId is provided', async () => {
      sinon.stub(Dataset, 'aggregate').returns(mockFilesetAggregate);
      const filesetGroup = await getFilesets(
        {},
        { input: filesetInput },
        { user, req, isAuthenticated: true }
      );

      expect(filesetGroup).to.have.property('filesets');
      expect(filesetGroup.filesets).to.be.an('array');
      expect(filesetGroup).to.have.property('pageSize');
    });

    it('should return an aggregated list of a fileset when only filesetName is provided', async () => {
      sinon
        .stub(Dataset, 'aggregate')
        .returns([{ filesets: mockDataset.filesets }]);
      const fileset = await getFilesets(
        {},
        { input: { filesetName: 'E109_S2_Huang_2016' } },
        { user, req, isAuthenticated: true }
      );
      expect(fileset).to.have.property('filesetName');
      expect(fileset).to.have.property('files');
      expect(fileset.files).to.be.an('array');
    });

    it('should throw a 401, not authenticated error', async () => {
      const error = await getFilesets(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: false }
      );
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Dataset, 'aggregate').throws();

      const result = await getFilesets(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });
  });

  context('createDataset', () => {
    it('should have createDataset(...) as a Mutation resolver', async function () {
      const { createDataset } = graphQlSchema.getMutationType().getFields();
      expect(createDataset.name).to.equal('createDataset');
      expect(createDataset.type.toString()).to.equal('CreatedDataset!');
    });

    it('should create a new dataset', async () => {
      const mockCreatedDataset = {
        _id: '62d951cb6981a12d136a0a0d',
        ...mockDataset
      };
      sinon
        .stub(Dataset, 'findOne')
        .returns({ _id: '62d951cb6981a12d136a0a0d', filesets: [] });
      sinon
        .stub(Dataset, 'findOneAndUpdate')
        .callsFake(() => mockCreatedDataset);

      const dataset = await createDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: true }
      );
      expect(dataset).to.have.property('filesets');
    });

    it('should create a new dataset when files is empty', async () => {
      const mockCreatedDataset = {
        _id: '62d951cb6981a12d136a0a0d',
        ...mockDataset
      };
      sinon
        .stub(Dataset, 'findOne')
        .returns({ _id: '62d951cb6981a12d136a0a0d', filesets: [] });
      sinon
        .stub(Dataset, 'findOneAndUpdate')
        .callsFake(() => mockCreatedDataset);

      const dataset = await createDataset(
        {},
        { input: { ...mockFiles, files: [] } },
        { user, req, isAuthenticated: true }
      );
      expect(dataset).to.have.property('filesets');
    });

    it('should throw a 401, not authenticated error', async () => {
      const result = await createDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: false }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401);
    });

    it('should return a 404, not found error', async () => {
      sinon.stub(Dataset, 'findOne').returns(null);

      const result = await createDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(404);
    });

    it('should return a 409, conflict error', async () => {
      sinon.stub(Dataset, 'findOne').returns(mockDataset);

      const result = await createDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(409);
    });

    it('should throw a 500 error', async () => {
      sinon.stub(Dataset, 'findOne').returns({
        _id: '62d951cb6981a12d136a0a0d',
        status: 'WORK IN PROGRESS'
      });
      sinon.stub(Dataset, 'findOneAndUpdate').throws();

      const result = await createDataset(
        {},
        { input: mockFiles },
        { user, req, isAuthenticated: true }
      );

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500);
    });

    it('should return CreatedDataset datatype for createDatasetId(...) mutation', () => {
      const { createDataset } = graphQlSchema.getMutationType().getFields();
      expect(createDataset.type.toString()).to.equal('CreatedDataset!');
    });
  });
});
