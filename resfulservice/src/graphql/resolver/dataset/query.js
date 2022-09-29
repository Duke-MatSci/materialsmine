const DatasetId = require('../../../models/datasetId');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const { datasetTransformer, filesetsTransform } = require('../../transformer');
const { filesetSearchQuery } = require('../../../pipelines/dataset-pipeline');

const datasetQuery = {
  getUserDataset: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[getUserDatasetIds] Function Entry');
    if (!isAuthenticated) {
      req.logger?.error('[getUserDatasetIds]: User unauthorized');
      return errorFormater('Unauthorized', 401);
    }
    try {
      const filter = {};
      if (user?.roles !== 'admin') filter.userid = user.userid;
      if (input?.status) filter.status = input.status;
      const pagination = paginator(await DatasetId.countDocuments(filter));
      const datasets = await datasetTransformer(await DatasetId.findOne(filter)
        .populate('user', 'displayName')
        .populate('dataset', 'filesets')
        .lean().limit(1));
      return Object.assign(pagination, { datasets });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },

  getFilesets: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[getFilesets] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[getFilesets]: User unauthorized');
      return errorFormater('Unauthorized', 401);
    }
    try {
      const { counts, filesets } = await filesetSearchQuery({
        userid: user.userid,
        datasetId: input.datasetId,
        filesetName: input?.filesetName,
        skip: input?.pageNumber,
        limit: input?.pageSize
      });

      if (input?.filesetName) {
        return filesetsTransform([filesets])?.pop();
      }
      const pagination = paginator(counts, input.pageNumber, input.pageSize);
      return Object.assign(pagination, { filesets: filesetsTransform(filesets) });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = datasetQuery;
