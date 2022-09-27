const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
// const PixelData = require('../../../models/pixelated');
const { pixelDataTransformer } = require('../../transformer');

const pixelatedDataExplorerQuery = {
  pixelData: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[pixelData]: Function entry');
    try {
      const pagination = paginator(1);
      const data = await pixelDataTransformer(input.unitCell);

      return Object.assign(pagination, { data });
    } catch (err) {
      req.logger?.error(`[pixelData]: ${err}`);
      return errorFormater(err.message, 500);
    }
  }
};

module.exports = pixelatedDataExplorerQuery;
