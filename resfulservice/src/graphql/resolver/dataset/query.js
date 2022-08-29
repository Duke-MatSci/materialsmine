const DatasetId = require('../../../models/datasetId');
const Dataset = require('../../../models/dataset');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const { datasetTransformer } = require('../../transformer');

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

      console.log(user);
      console.log(filter);
      const pagination = paginator(await DatasetId.countDocuments(filter));
      const data = datasetTransformer(await DatasetId.find(filter).populate('user').lean());
      return { ...pagination, data };
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
      const { filesets } = await Dataset.findOne({
        userid: user._id,
        datasetId: input.datasetId
      }).lean();
      const { fileset, files } = filesets.find(({ fileset }) => fileset === input.fileset);
      const formatedFiles = files.map(({ id, metadata: { filename, contentType } }) => ({ id, contentType, filename }));
      return { filesetName: fileset, files: formatedFiles };
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = datasetQuery;
