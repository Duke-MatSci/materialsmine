const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const datasetIdSchema = new Schema({
  attribute: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DatasetProperty', datasetIdSchema);
