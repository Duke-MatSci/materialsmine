const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  }
}, { timestamps: true });

module.exports = mongoose.model('CuratedSample', curatedObjectSchema);
