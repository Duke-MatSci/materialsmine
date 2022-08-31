const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const errorFormater = require('../utils/errorFormater');

exports.filesetSearchQuery = async ({ datasetId, filesetName, skip, limit }) => {
  const stages = [];
  const skipArg = skip ?? 0;
  const limitArg = limit ?? 10;

  if (!datasetId && !filesetName) throw errorFormater('Missing filter values', 422);

  if (datasetId) {
    stages.push({
      $match: {
        _id: mongoose.Types.ObjectId(datasetId)
      }
    });
    stages.push({
      $match: {
        filesets: { $exists: true }
      }
    });
  }

  if (filesetName) {
    stages.push({
      $unwind: {
        path: '$filesets'
      }
    });
    stages.push({
      $match: {
        'filesets.fileset': filesetName
      }
    });
  }

  stages.push({
    $project: {
      _id: 0,
      counts: { $size: '$filesets' },
      filesets: {
        $slice: ['$filesets', skipArg, limitArg]
      }
    }
  });

  const queryData = await Dataset.aggregate(stages);
  if (queryData.length) {
    const { counts, filesets } = queryData.pop();
    return { counts, filesets };
  }
  return { counts: 0, filesets: [] };
};
