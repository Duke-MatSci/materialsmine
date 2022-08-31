const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pixelDataSchema = new Schema({
  symmetry: {
    type: String
  },
  unit_cell_x_pixels: {
    type: String
  },
  unit_cell_y_pixels: {
    type: String
  },
  geometry_condensed: {
    type: String
  },
  geometry_full: {
    type: String
  },
  condition: {
    type: String
  },
  C11: {
    type: String
  },
  C12: {
    type: String
  },
  C22: {
    type: String
  },
  C16: {
    type: String
  },
  C26: {
    type: String
  },
  C66: {
    type: String
  },
  CM0: {
    type: String
  },
  CM0_C11: {
    type: String
  },
  CM0_C12: {
    type: String
  },
  CM0_C22: {
    type: String
  },
  CM0_C16: {
    type: String
  },
  CM0_C26: {
    type: String
  },
  CM0_C66: {
    type: String
  },
  CM1: {
    type: String
  },
  CM1_C11: {
    type: String
  },
  CM1_C12: {
    type: String
  },
  CM1_C22: {
    type: String
  },
  CM1_C16: {
    type: String
  },
  CM1_C26: {
    type: String
  },
  CM1_C66: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PixelData', pixelDataSchema);
