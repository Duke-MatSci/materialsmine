const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteChartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chartIds: [
    {
      type: String,
      required: true
    }
  ]
});

module.exports = mongoose.model('FavoriteChart', favoriteChartSchema);
