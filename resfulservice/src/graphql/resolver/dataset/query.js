const Dataset = require('../../../models/dataset');
const User = require('../../../models/user');
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
      const filter = { };
      // Todo: (@tholulomo) Configure pageSize and pageNumber with config
      const pageNumber = parseInt(input.pageNumber, 10) ?? 0;
      const pageSize = parseInt(input.pageSize, 10) ?? 20;
      const skip = pageNumber * pageSize;
      if (user?.roles !== 'admin') filter.userid = user.userid;
      if (user?.roles === 'admin' && !input?.showAll) filter.userid = user.userid;
      if (input?.status) {
        if (input.status === 'APPROVED') {
          filter.isPublic = true;
        }
      }
      const [count, dataset, userDetails] = await Promise.all([
        Dataset.countDocuments(filter),
        Dataset.find(filter)
          .skip(skip)
          .limit(pageSize),
        User.findOne({ userid: user.userid }, { displayName: 1 })
      ]);
      const pagination = paginator(count, input.pageNumber, input.pageSize);
      const datasets = await datasetTransformer(dataset, userDetails, true);
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
