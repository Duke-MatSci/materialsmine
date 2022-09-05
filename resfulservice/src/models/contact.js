const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactSChema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['QUESTION', 'TICKET', 'SUGGESTION', 'COMMENT']
  },
  message: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSChema);
