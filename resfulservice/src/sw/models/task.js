const mongoose = require('mongoose');
const {
  TaskStatus,
  TaskStatusDefault,
  RunTime,
  RunTimeDefault
} = require('../../../config/constant');
const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    serviceName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: TaskStatus,
      required: true,
      default: TaskStatusDefault
    },
    whenToRun: {
      type: String,
      enum: RunTime,
      default: RunTimeDefault
    },
    info: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
