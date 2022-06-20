const Xmls = require('../../../models/xmlData');
const { imageTransformer } = require('../../transformer');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

const validateSearchOptions = (input) => {
  const searchQuery = [];
  const search = input?.search;
  console.log('tolu3', search);
  // Search by year
  const parsedSearch = parseInt(search);
  console.log('tolu4', parsedSearch);
  if (typeof parsedSearch === 'number') {
    // if (search.length > 4) throw errorFormater('Year cannot exceed four digit', 422);
    // searchQuery.push({
    //   $match: {
    //     'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.PublicationYear': {
    //       $exists: true
    //     }
    //   }
    // });
    // searchQuery.push({
    //   $match: {
    //     'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.PublicationYear': parseInt(search)
    //   }
    // });
    // return searchQuery;
  }

  // Search by sentence
  const wholeSentence = new RegExp(search, 'gi');
  searchQuery.push({
    $match: {
      'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.Keyword': {
        $exists: true
      }
    }
  });
  searchQuery.push({
    $match: {
      'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.Keyword': {
        $in: [wholeSentence]
      }
    }
  });
  return searchQuery;
};

const imageQuery = async (skip = 0, limit = 10, search = false) => {
  const stages = [];
  const targetField = 'content.PolymerNanocomposite.MICROSTRUCTURE.ImageFile';

  if (search) {
    search.map(stage => stages.push(stage));
  }

  stages.push({
    $match: {
      [targetField]: {
        $exists: true
      }
    }
  });

  stages.push({
    $unwind: {
      path: `$${targetField}`,
      preserveNullAndEmptyArrays: false
    }
  });
  stages.push({
    $group: {
      _id: 'null',
      image: {
        $push: `$${targetField}`
      }
    }
  });
  stages.push({
    $project: {
      _id: 0,
      counts: {
        $size: '$image'
      },
      images: {
        $slice: [
          '$image',
          skip,
          limit
        ]
      }
    }
  });
  const queryData = await Xmls.aggregate(stages);
  if (queryData.length) {
    const { counts, images } = queryData.pop();
    return { counts, images };
  }
  return { counts: 0, images: [] };
};

const imageExplorerQuery = {
  searchImages: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[searchImages]: Function entry');
    try {
      const search = validateSearchOptions(input);
      const pagination = input ? paginator((await imageQuery(_, _, search))?.counts, input.pageNumber, input.pageSize) : paginator((await imageQuery(_, _, search))?.counts);
      const images = imageTransformer((await imageQuery(pagination.skip, pagination.limit, search))?.images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[searchImages]: ${err}`);
      return errorFormater(err.message, 500);
    }
  },

  images: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[images]: Function entry');
    try {
      const pagination = input ? paginator((await imageQuery())?.counts, input.pageNumber, input.pageSize) : paginator((await imageQuery())?.counts);
      const images = imageTransformer((await imageQuery(pagination.skip, pagination.limit))?.images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[images]: ${err}`);
      return errorFormater(err.message, 500);
    }
  },

  singleImageLoader: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[singleImageLoader]: Function entry');
    try {
      const pagination = input ? paginator((await imageQuery())?.counts, input.pageNumber, input.pageSize) : paginator((await imageQuery())?.counts);
      const images = imageTransformer((await imageQuery(pagination.skip, pagination.limit))?.images);
      return Object.assign(pagination, { images });
    } catch (err) {
      req.logger?.error(`[singleImageLoader]: ${err}`);
      return errorFormater(err.message, 500);
    }
  }
};

module.exports = imageExplorerQuery;
