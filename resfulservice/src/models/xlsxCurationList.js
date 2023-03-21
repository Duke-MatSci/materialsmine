const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const xlsxCurationListSchema = new Schema({
  field: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  },
  values: {
    type: [String],
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('xlsxCurationList', xlsxCurationListSchema);
