const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { CurationStates, CurationEntityStates, CurationStateDefault, CurationEntityStateDefault } = require('../../config/constant');

const curatedObjectSchema = new Schema({
  object: {
    type: Schema.Types.Mixed,
    required: true
  },
  dataset: {
    type: Schema.Types.ObjectId,
    ref: 'DatasetId',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  curationState: {
    type: String,
    enum: CurationStates,
    required: true,
    default: CurationStateDefault
  },
  entityState: {
    type: String,
    enum: CurationEntityStates,
    required: true,
    default: CurationEntityStateDefault
  }
}, { timestamps: true });

module.exports = mongoose.model('CuratedSample', curatedObjectSchema);
