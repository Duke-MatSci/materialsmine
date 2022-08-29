const DatasetId = require('../../../models/datasetId');
const errorFormater = require('../../../utils/errorFormater');

const datasetMutation = {
  createDatasetId: async (_, _input, { user, req, isAuthenticated }) => {
    req.logger.info('createDatasetId Function Entry');
    if (!isAuthenticated) {
      req.logger?.error('[createDatasetId]: User unauthorized');
      return errorFormater('Unauthorized', 401);
    }
    const datasetId = new DatasetId({ user });
    try {
      await datasetId.save();
      return datasetId;
    } catch (error) {
      req.logger.error(`[createDatasetId]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = datasetMutation;
