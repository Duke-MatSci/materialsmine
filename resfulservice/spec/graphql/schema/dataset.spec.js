const { expect } = require('chai');
const graphQlSchema = require('../../../src/graphql');

describe('Dataset Schema Unit Tests:', function () {

  context('getUserDataset', () => {
    it('should have getUserDataset as a RootQuery field', async function () {
      const { getUserDataset } = graphQlSchema.getQueryType().getFields();
      expect(getUserDataset.name).to.equal('getUserDataset');
      expect(getUserDataset.type.toString()).to.equal('UserDataset!');
    });
  })

  context('getFilesets', () => {
    it('should have getFilesets as a RootQuery field', async function () {
      const { getFilesets } = graphQlSchema.getQueryType().getFields();
      expect(getFilesets.name).to.equal('getFilesets');
      expect(getFilesets.type.toString()).to.equal('Filesets!');
    });
  })

  context('Fileset', () => {
    it("should have ['filesetName', 'files'] Files schema", async function () {
      const files = graphQlSchema.getType('Fileset');
      const keys = Object.keys(files.getFields());
      expect(keys).to.include.members(['filesetName', 'files']);
    });

    it('should have correct datatypes for Fileset schema', async function () {
      const filesData = graphQlSchema.getType('Fileset');
      const { filesetName, files } = filesData.getFields();

      expect(filesetName.type.toString()).to.equal('String');
      expect(files.type.toString()).to.equal('[File!]');
    });
  });

  context('UserDataset', () => {
    it("should have ['totalItems', 'pageSize', 'pageNumber', 'totalPages', 'hasPreviousPage', 'hasNextPage', 'datasets'] UserDataset schema", async function () {
      const userDataset = graphQlSchema.getType('UserDataset');
      const keys = Object.keys(userDataset.getFields());
      expect(keys).to.include.members(['totalItems', 'pageSize', 'pageNumber', 'totalPages', 'hasPreviousPage', 'hasNextPage', 'datasets']);
    });

    it('should have correct datatypes for UserDataset schema', async function () {
      const userDataset = graphQlSchema.getType('UserDataset');
      const { totalItems, pageSize, pageNumber, totalPages, hasPreviousPage, hasNextPage, datasets } = userDataset.getFields();

      expect(totalItems.type.toString()).to.equal('Int');
      expect(pageSize.type.toString()).to.equal('Int!');
      expect(pageNumber.type.toString()).to.equal('Int!');
      expect(totalPages.type.toString()).to.equal('Int!');
      expect(hasPreviousPage.type.toString()).to.equal('Boolean!');
      expect(hasNextPage.type.toString()).to.equal('Boolean!');
      expect(datasets.type.toString()).to.equal('[Datasets!]');
    });
  });

  context('Datasets', () => {
    it("should have ['datasetGroupId', 'user', 'status', 'userDatasetInfo', 'createdAt', 'updatedAt']  Datasets schema", async function () {
      const datasets = graphQlSchema.getType('Datasets');
      const keys = Object.keys(datasets.getFields());
      expect(keys).to.include.members(['datasetGroupId', 'user', 'status', 'userDatasetInfo', 'createdAt', 'updatedAt']);
    });

    it('should have correct datatypes for  Datasets schema', async function () {
      const datasets = graphQlSchema.getType('Datasets');
      const { datasetGroupId, user, status, userDatasetInfo, createdAt, updatedAt } = datasets.getFields();

      expect(datasetGroupId.type.toString()).to.equal('ID');
      expect(user.type.toString()).to.equal('VerifiedUser');
      expect(status.type.toString()).to.equal('STATUS');
      expect(userDatasetInfo.type.toString()).to.equal('[Dataset!]');
      expect(createdAt.type.toString()).to.equal('String');
      expect(updatedAt.type.toString()).to.equal('String');
    });
  })
});