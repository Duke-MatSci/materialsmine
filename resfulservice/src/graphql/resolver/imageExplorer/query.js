const { imageTransformer } = require('../../transformer');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const { validateImageSearchOptions, imageQuery } = require('../../../pipelines/image-pipeline');

const imageExplorerQuery = {
  searchImages: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[searchImages]: Function entry');
    try {
      const search = validateImageSearchOptions(input);
      const pagination = input
        ? paginator((await imageQuery({ search, input }))?.counts, input.pageNumber, input.pageSize)
        : paginator((await imageQuery({ search, input }))?.counts);
      const images = imageTransformer((await imageQuery({
        search,
        skip: pagination.skip,
        limit: pagination.limit,
        input
      })).images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[searchImages]: ${err}`);
      return errorFormater(err.message, 500);
    }
  },

  images: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[images]: Function entry');
    try {
      const pagination = input
        ? paginator((await imageQuery())?.counts, input.pageNumber, input.pageSize)
        : paginator((await imageQuery())?.counts);
      const images = imageTransformer((await imageQuery({ skip: pagination.skip, limit: pagination.limit }))?.images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[images]: ${err}`);
      return errorFormater(err.message, 500);
    }
  },

  getSingleImages: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[getSingleImages]: Function entry');
    const selectedImg = input?.id;
    if (!selectedImg) throw errorFormater('A sample ID is required', 422);
    try {
      const pagination = input ? paginator((await imageQuery({ selectedImg }))?.counts, input.pageNumber, input.pageSize) : paginator((await imageQuery({ selectedImg }))?.counts);
      const images = imageTransformer((await imageQuery({ skip: pagination.skip, limit: pagination.limit, selectedImg }))?.images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[getSingleImages]: ${err}`);
      return errorFormater(err.message, 500);
    }
  }
};

module.exports = imageExplorerQuery;
