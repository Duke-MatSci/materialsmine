const mongoose = require('mongoose');

const fillerSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  _density: {
    type: Number
  },
  _alias: {
    type: [String],
    default: []
  },
  _boc: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('ukfiller', fillerSchema);
