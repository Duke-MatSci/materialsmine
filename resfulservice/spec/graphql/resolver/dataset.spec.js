const chai = require('chai');
const sinon = require('sinon');
const DatasetId = require('../../../src/models/datasetId');
const Dataset = require('../../../src/models/dataset');
const graphQlSchema = require('../../../src/graphql');
const { Mutation: { createDatasetId, createDataset }, Query: { getUserDataset, getFilesets }} = require('../../../src/graphql/resolver');

const { expect } = chai;


describe('Dataset Resolver Unit Tests:', function () {

  afterEach(() => sinon.restore());

  this.timeout(10000)

  const input = {
    doi: 'unpublished/doi-tMbKM2ba5aNwo2ZKPVucBS',
    datasetId: '62fce36374da548513a38a9b',
    files: [
      {
        fieldname: 'uploadfile',
        originalname: 'Hopetoun_falls.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'mm_fils',
        filename: 'comparative_aphid_agathe-2022-08-18T10:00:40.910Z-Hopetoun_falls.jpg',
        path: 'mm_fils/comparative_aphid_agathe-2022-08-18T10:00:40.910Z-Hopetoun_falls.jpg',
        size: 2954043,
      },
      {
        fieldname: 'uploadfile',
        originalname: 'flowers-276014__340.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'mm_fils',
        filename: 'comparative_aphid_agathe-2022-08-18T10:00:41.018Z-flowers-276014__340.jpg',
        path: 'mm_fils/comparative_aphid_agathe-2022-08-18T10:00:41.018Z-flowers-276014__340.jpg',
        size: 56575,
      },
    ],
  }



  const mockDataset = { 
    _id:  "62f11b1328eedaab012d127c",
    datasetId: "62f11b1328eedaab012d127c",
    userid: "62f119fb28eedaab012d1262",
    filesets: [
      {
        fileset: 'E109_S2_Huang_2016',
        files: [
          {
            type: 'blob',
            id: '5b51f112e74a1d4cdbad6a1d',
            metadata: {
              filename: '4.tif',
              contentType: 'image/tiff',
            },
          },
          {
            type: 'blob',
            id: '5b51f137e74a1d4cdbad6a3a',
            metadata: {
              filename: '5.tif',
              contentType: 'image/tiff',
            },
          },
        ],
      },
    ],
    lean: () => this
  }

  const user = {
    _id: '62dab1b76db8739c8330611d',
    alias: 'testalias',
    givenName: 'test',
    surName: 'test user',
    displayName: 'tester',
    email: 'test@example.com',
    roles: 'member'
  }

  const req = { logger: { info: (message) => { }, error: (message) => { } } }

  context('createDatasetId', () => {
    it('should have createDatasetId(...) as a Mutation resolver', async function () {
      const { createDatasetId } = graphQlSchema.getMutationType().getFields();
      expect(createDatasetId.name).to.equal('createDatasetId');
      expect(createDatasetId.type.toString()).to.equal('Datasets!');
    });

    it.skip('should create a new datasetId', async () => {
      sinon.stub(DatasetId.prototype, 'save').callsFake(() => ({_id: '62d951cb6981a12d136a0a0d', populate: () => user, status: 'WORK IN PROGRESS'}))

      const datasetId = await createDatasetId({}, {}, { user, req, isAuthenticated: true });

      expect(datasetId).to.have.property('_id');
    }); 

    it("should throw a 401, not authenticated error", async () => {

      const result = await createDatasetId({}, { }, { user, req, isAuthenticated: false });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401)
    });

    it.skip('should throw a 500 error', async () => {
      sinon.stub(DatasetId.prototype, 'save').throws();

      const result = await createDatasetId({}, { }, { user, req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });

    it('should return DatasetId! datatype for createDatasetId(...) mutation', () => {
      const { createDatasetId } = graphQlSchema.getMutationType().getFields();
      expect(createDatasetId.type.toString()).to.equal('Datasets!');
    });
  });

  context('getUserDataset', () => {
    const mockDatasetId = {
      _id: '9q4kn9898ani4a8n49hn49nv49',
      dataset: mockDataset,
      user,
      status: 'WORK_IN_PROGRESS',
      lean: () => this,
      populate: () => this,
      limit: () => this 
    }


    it.skip("should return paginated lists of a user's datasets", async () => {
      sinon.stub(DatasetId, 'aggregate').returns(mockDatasetId);
      const datasets = await getUserDataset({}, { input }, { user, req, isAuthenticated: true });
      expect(datasets).to.have.property('datasetId');
      expect(datasets.totalItems).to.equal(1);
    });

    it("should throw a 401, not authenticated error", async () => {

      const error = await getUserDataset({}, { input }, { user, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Dataset, 'find').throws();

      const result = await getUserDataset({}, { input }, { user, req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });
  });

  context('getFilesets', () => {
    const mockFilesetAggregate = [{
        count: 1,
        filesets: mockDataset.filesets
    }] 
    it("should return file list of a fileset when both datasetId and filesetName are provided", async () => {
      sinon.stub(Dataset, 'aggregate').returns(mockFilesetAggregate);
    //   sinon.stub(mockDataset, 'lean').returnsThis();
      const fileset = await getFilesets({}, { input: { ...input, filesetName: 'E109_S2_Huang_2016' } }, { user, req, isAuthenticated: true });

      expect(fileset).to.have.property('filesetName');
      expect(fileset).to.have.property('files');
      expect(fileset.files).to.be.an('array');

    });

    it.skip("should return file list of a fileset when only datasetId is provided", async () => {
      sinon.stub(Dataset, 'aggregate').returns(mockFilesetAggregate);
      const filesetGroup = await getFilesets({}, { input }, { user, req, isAuthenticated: true });

      expect(filesetGroup).to.have.property('filesets');
      expect(filesetGroup.filesets).to.be.an('array');
      expect(filesetGroup).to.have.property('pageSize');
    });

    it("should return an aggregated list of a fileset when only filesetName is provided", async () => {
      sinon.stub(Dataset, 'aggregate').returns([{filesets: mockDataset.filesets}]);
      sinon.stub(mockDataset, 'lean').returnsThis();
      const fileset = await getFilesets({}, {input: { filesetName: 'E109_S2_Huang_2016' } }, { user, req, isAuthenticated: true });

      expect(fileset).to.have.property('filesetName');
      expect(fileset).to.have.property('files');
      expect(fileset.files).to.be.an('array');
    });

    it("should throw a 401, not authenticated error", async () => {

      const error = await getFilesets({}, { input }, { user, req, isAuthenticated: false }); 
      expect(error).to.have.property('extensions');
      expect(error.extensions.code).to.be.equal(401);
    });

    it('should return a 500 error', async () => {
      sinon.stub(Dataset, 'aggregate').throws();

      const result = await getFilesets({}, { input }, { user, req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
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
      }
      sinon.stub(Dataset, 'findOne').returns({ _id: '62d951cb6981a12d136a0a0d',  filesets: []  })
      sinon.stub(Dataset, 'findOneAndUpdate').callsFake(() => (mockCreatedDataset))

      const dataset = await createDataset({}, { input }, { user, req, isAuthenticated: true });
      expect(dataset).to.have.property('filesets');
    });

    it("should throw a 401, not authenticated error", async () => {
      const result = await createDataset({}, { input }, { user, req, isAuthenticated: false });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(401)
    });

    it('should return a 404, not found error', async () => {
      sinon.stub(Dataset, 'findOne').returns(null)

      const result = await createDataset({}, { input }, { user, req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(404)
    });

    it('should throw a 500 error', async () => {
      sinon.stub(Dataset, 'findOne').returns({ _id: '62d951cb6981a12d136a0a0d', status: 'WORK IN PROGRESS' })
      sinon.stub(Dataset, 'findOneAndUpdate').throws()

      const result = await createDataset({}, { input }, { user, req, isAuthenticated: true });

      expect(result).to.have.property('extensions');
      expect(result.extensions.code).to.be.equal(500)
    });

    it('should return CreatedDataset datatype for createDatasetId(...) mutation', () => {
      const { createDataset } = graphQlSchema.getMutationType().getFields();
      expect(createDataset.type.toString()).to.equal('CreatedDataset!');
    });
  })
});
