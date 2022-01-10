const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema(
  {
    alias: {
      type: String
    },
    userid: {
      type: String
    },
    givenName: {
      type: String
    },
    surName: {
      type: String
    },
    displayName: {
      type: String
    },
    email: {
      type: String
    },
    apiAccess: {
      type: [String]
    }
  }
);

module.exports = mongoose.model('User', usersSchema);
