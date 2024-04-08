const mongoose = require('mongoose');
const { ContactPagePurposeOpt } = require('../../config/constant');
const Schema = mongoose.Schema;

const contactSChema = new Schema(
  {
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
      enum: ContactPagePurposeOpt
    },
    message: {
      type: String,
      required: true
    },
    attachments: [
      {
        type: String
      }
    ],
    resolved: {
      type: Boolean,
      default: false
    },
    response: {
      type: String
    },
    resolvedBy: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSChema);
