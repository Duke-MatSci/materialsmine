const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This collection stores temporary files which are later deleted using a node cron job.
const tempFilesSchema = new Schema({
  filename: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('curationTempFiles', tempFilesSchema);
