const mongoose = require('mongoose');
const Xmls = require('../models/xmlData');
const errorFormater = require('../utils/errorFormater');

const targetField = 'content.PolymerNanocomposite.MICROSTRUCTURE.ImageFile';
const commonFields = 'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields';
const fillerFields = 'content.PolymerNanocomposite.MATERIALS.Filler.FillerComponent';

exports.imageQuery = async (args) => {
  const skip = args?.skip ?? 0;
  const limit = args?.limit ?? 20;
  const search = args?.search ?? false;
  const input = args?.input ?? false;
  const selectedImg = args?.selectedImg ?? false;

  const stages = [];

  if (search.length) {
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
        doi: `$${commonFields}.DOI`,
        keywords: `$${commonFields}.Keyword`,
        authors: `$${commonFields}.Author`
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
    $unwind: {
      path: '$image',
      preserveNullAndEmptyArrays: false
    }
  });

  if (search.length) {
    // This removes noise in response by removing items parsed that does not match searchValue
    if (input?.search === 'filterByMicroscopy') {
      stages.push({
        $match: {
          'image.MicroscopyType': input.searchValue
        }
      });
    } else if (input?.search === 'Keyword') {
      const wholeSentence = new RegExp(input.searchValue, 'gi');
      stages.push({
        $match: {
          'image.metaData.keywords': {
            $in: [wholeSentence]
          }
        }
      });
    }
  }

  // Removing undefined files from result array
  stages.push({
    $match: {
      'image.File': { $not: /undefined/ }
    }
  });

  // Regrouping after removing undefined files
  stages.push({
    $group: {
      _id: 'null',
      image: {
        $push: '$image'
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
  const searchValue = input?.searchValue || '';

  if (!searchValue) throw errorFormater('Search value cannot be empty', 422);

  // Search by year
  if (search === 'filterByYear') {
    if (searchValue.length > 4) throw errorFormater('Year cannot exceed four digit', 422);
    searchQuery.push({
      $match: {
        [`${commonFields}.PublicationYear`]: {
          $exists: true
        }
      }
    });
    searchQuery.push({
      $match: {
        [`${commonFields}.PublicationYear`]: parseInt(searchValue)
      }
    });
    return searchQuery;
  }

  // Search by filler
  if (search === 'filterByFiller') {
    const value = new RegExp(searchValue, 'gi');
    searchQuery.push({
      $match: {
        [fillerFields]: {
          $exists: true
        }
      }
    });
    searchQuery.push({
      $match: {
        [fillerFields]: {
          $elemMatch: { ChemicalName: value }
        }
      }
    });
    return searchQuery;
  }

  // Search by microscopy type
  if (search === 'filterByMicroscopy') {
    searchQuery.push({
      $match: {
        [`${targetField}.MicroscopyType`]: {
          $exists: true
        }
      }
    });
    searchQuery.push({
      $match: {
        [`${targetField}.MicroscopyType`]: { $regex: searchValue, $options: 'g' }
      }
    });
    return searchQuery;
  }

  // Search by DOI
  if (search === 'filterByDOI') {
    searchQuery.push({
      $match: {
        [`${commonFields}.DOI`]: {
          $exists: true
        }
      }
    });
    searchQuery.push({
      $match: {
        [`${commonFields}.DOI`]: { $regex: searchValue, $options: 'g' }
      }
    });
    return searchQuery;
  }

  // Search by sentence
  const wholeSentence = new RegExp(searchValue, 'gi');
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
};
