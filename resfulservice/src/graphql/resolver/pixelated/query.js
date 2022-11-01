const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const PixelData = require('../../../models/pixelated');

const pixelatedDataExplorerQuery = {
  pixelData: async (_, { input }, { req }) => {
    // TODO: Fix logger issue.
    // req.logger?.info('[pixelData]: Function entry');
    try {
      if (input?.unitCell === 'BOTH') return errorFormater('Only TEN and FIFTY are allowed', 400);
      const unitCell = input.unitCell === 'TEN' ? '10' : '50';
      let data;
      const pagination = paginator(await PixelData.countDocuments({ unit_cell_x_pixels: unitCell }), input.pageNumber, input.pageSize);
      if (!input.pageSize) {
        pagination.limit = pagination.totalItems;
        pagination.pageSize = pagination.totalItems;
        pagination.totalPages = pagination.pageNumber;
        pagination.hasNextPage = pagination.hasPreviousPage;
        data = await PixelData.find({ unit_cell_x_pixels: unitCell });
      } else {
        data = await PixelData.find({ unit_cell_x_pixels: unitCell }).skip(pagination.skip).limit(pagination.limit).lean();
      }
      data = await PixelData.find({ unit_cell_x_pixels: unitCell });
      return Object.assign(pagination, { data });
    } catch (err) {
      req.logger?.error(`[pixelData]: ${err}`);
      return errorFormater(err.message, 500);
    }
  }
};

module.exports = pixelatedDataExplorerQuery;
