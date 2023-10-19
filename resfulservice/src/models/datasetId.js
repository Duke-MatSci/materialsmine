const mongoose = require('mongoose');
const { DatasetStatusOpt, DatasetStatusDefault } = require('../../config/constant');
const Schema = mongoose.Schema;

const datasetIdSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  controlSampleID: {
    type: String
  },
  status: {
    type: String,
    enum: DatasetStatusOpt,
    default: DatasetStatusDefault
  },
  samples: [{
    type: Schema.Types.ObjectId,
    ref: 'CuratedSample'
  }]
}, { timestamps: true });

module.exports = mongoose.model('DatasetId', datasetIdSchema);