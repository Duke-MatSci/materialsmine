const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fsfilesSchema = new Schema(
  {
    chunkSize: {
      type: Number
    },
    filename: {
      type: String
    },
    length: {
      type: Number
    },
    uploadDate: {
      type: Date
    },
    md5: {
      type: String
    }
  }
);

module.exports = mongoose.model('fs.files', fsfilesSchema);
