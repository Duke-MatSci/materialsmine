const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apiAccessSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  key: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ApiAccess', apiAccessSchema);
