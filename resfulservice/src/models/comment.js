const mongoose = require('mongoose');
const { commentTypes } = require('../../config/constant');
const Schema = mongoose.Schema;

const commentSChema = new Schema({

  comment: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: commentTypes
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  identifier: {
    type: Schema.Types.ObjectId
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSChema);
