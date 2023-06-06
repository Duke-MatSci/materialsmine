const errorFormater = require('../../../utils/errorFormater');
const deleteFile = require('../../../utils/fileManager');
const Dataset = require('../../../models/dataset');
const DatasetId = require('../../../models/datasetId');
const { datasetTransformer, filesetsTransform } = require('../../transformer');

const datasetMutation = {
  createDatasetId: async (_, _input, { user, req, isAuthenticated }) => {
    req.logger.info('createDatasetId Function Entry');
    if (!isAuthenticated) {
      req.logger?.error('[createDatasetId]: User unauthorized');
      return errorFormater('Unauthorized', 401);
    }
    try {
      const { _id, displayName } = user;
      const unusedDatasetId = await DatasetId.findOne({ user: _id, samples: [] });
      if (unusedDatasetId?._id) {
        req.logger.error('[createDatasetId]: Failed to create. User has unused existing dataset Id');
        const err = { message: `An unused datasetId - ${unusedDatasetId?._id} exists` };
        return errorFormater(err.message, 409);
      }

      const datasetId = new Dataset({ user: _id });
      const savedDataset = await datasetId.save();

      return datasetTransformer(savedDataset, { _id, displayName });
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
        return errorFormater('not authenticated', 401);
      }
      const datasetId = await Dataset.findOne({ _id: input.datasetId, userid: user.userid });
      if (!datasetId) {
        req.logger?.error('[fileUpload]: datasetId not found');
        input.files.forEach(({ path }) => {
          deleteFile(path, req);
        });
        return errorFormater('datasetId not found', 404);
      }

      if (datasetId.filesets.length) {
        input.files.forEach(({ path }) => {
          deleteFile(path, req);
        });
        return errorFormater('Cancelled an overwrite attempt, this is not an empty dataset', 409);
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

      const dataset = await Dataset.findOneAndUpdate(
        { _id: input.datasetId, userid: user.userid },
        {
          $set: {
            title: input?.title,
            author: [input.author],
            doi: input.doi,
            datasetId: input.datasetId,
            filesets: [
              {
                fileset: 'L325_S1_Test_2015',
                files
              }
            ],
            dttm_updated: Math.floor(Date.now() / 1000)
          }
        },
        {
          returnDocument: 'after'
        }
      );

      const filesets = filesetsTransform(dataset.filesets);
      return Object.assign(dataset, { filesets });
    } catch (error) {
      req.logger.error(error);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = datasetMutation;
