const mongoose = require('mongoose');

const polymerSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  _stdname: {
    type: String,
    required: true
  },
  _abbreviations: {
    type: [String],
    default: []
  },
  _synonyms: {
    type: [String],
    default: []
  },
  _tradenames: {
    type: [String],
    default: []
  },
  _density: {
    type: Number
  },
  _boc: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('polymer', polymerSchema);
