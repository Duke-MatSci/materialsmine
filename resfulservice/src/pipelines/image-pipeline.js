const mongoose = require('mongoose');
const Xmls = require('../models/xmlData');
const errorFormater = require('../utils/errorFormater');

const targetField = 'content.PolymerNanocomposite.MICROSTRUCTURE.ImageFile';
const commonFields = 'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields';

exports.imageQuery = async (args) => {
  const skip = args?.skip || 0;
  const limit = args?.limit || 10;
  const search = args?.search || false;
  const selectedImg = args?.selectedImg || false;

  const stages = [];

  if (search) {
    search.map(stage => stages.push(stage));
  }

  if (selectedImg) {
    stages.push({
      $match: {
        _id: mongoose.Types.ObjectId(selectedImg)
      }
    });
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
    $addFields: {
      [`${targetField}.metaData`]: {
        title: `$${commonFields}.Title`,
        id: '$_id',
        doi: `$${commonFields}.DOI`
      }
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
      counts: { $size: '$image' },
      images: {
        $slice: ['$image', skip, limit]
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

exports.validateImageSearchOptions = (input) => {
  const searchQuery = [];
  const search = input?.search;
  // Search by year
  const parsedSearch = parseInt(search);
  if (parsedSearch && typeof parsedSearch === 'number') {
    if (search.length > 4) throw errorFormater('Year cannot exceed four digit', 422);
    searchQuery.push({
      $match: {
        [`${commonFields}.PublicationYear`]: {
          $exists: true
        }
      }
    });
    searchQuery.push({
      $match: {
        [`${commonFields}.PublicationYear`]: parseInt(search)
      }
    });
    return searchQuery;
  }

  // Search by sentence
  const wholeSentence = new RegExp(search, 'gi');
  searchQuery.push({
    $match: {
      [`${commonFields}.Keyword`]: {
        $exists: true
      }
    }
  });
  searchQuery.push({
    $match: {
      [`${commonFields}.Keyword`]: {
        $in: [wholeSentence]
      }
    }
  });
  return searchQuery;
};
