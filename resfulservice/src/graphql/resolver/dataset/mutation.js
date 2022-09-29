const DatasetId = require('../../../models/datasetId');
const errorFormater = require('../../../utils/errorFormater');
const deleteFile = require('../../../utils/fileManager');
const Dataset = require('../../../models/dataset');
const { filesetsTransform } = require('../../transformer');

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
  },

  createDataset: async (_, { input }, { user, req, isAuthenticated }) => {
    try {
      req.logger.info('datasetIdUpload Function Entry:');
      if (!isAuthenticated) {
        req.logger?.error('[fileUpload]: User not authenticated to view user listing');
        input.files.forEach(({ path }) => {
          deleteFile(path, req);
        });
        return errorFormater('not authentiacted', 401);
      }
      const datasetId = await DatasetId.findOne({ _id: input.datasetId });
      if (!datasetId) {
        input.files.forEach(({ path }) => {
          deleteFile(path, req);
        });
        return errorFormater('datasetId not found', 404);
      }

      const files = input.files.length >= 1
        ? input.files.map(({ filename, mimetype }) => {
          return {
            id: filename,
            type: mimetype,
            metadata: {
              filename,
              contentType: mimetype
            }
          };
        })
        : [];

      const dataset = new Dataset({
        author: [input.author],
        doi: input.doi,
        datasetId: input.datasetId,
        userid: user._id,
        filesets: [
          {
            fileset: input.datasetId,
            files
          }
        ]
      });
      dataset.save();
      return Object.assign(dataset, { filesets: filesetsTransform(dataset.filesets) });
    } catch (error) {
      req.logger.error(error);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = datasetMutation;
