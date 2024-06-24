const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const changeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  change: {
    type: [String],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: false
  }
});

const changeLogSchema = new Schema(
  {
    resourceID: {
      type: Schema.Types.Mixed, // This allows the field to store any type, including ObjectId or string
      required: true
    },
    changes: [changeSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChangeLog', changeLogSchema);
