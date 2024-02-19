const mongoose = require('mongoose');
const Xmls = require('../models/xmlData');
const errorFormater = require('../utils/errorFormater');

const targetField = 'content.PolymerNanocomposite.MICROSTRUCTURE.ImageFile';
const commonFields =
  'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields';
const fillerFields =
  'content.PolymerNanocomposite.MATERIALS.Filler.FillerComponent';
const imgWithoutContentField = '$xml_str';
const listCap = 1000; // Pull as many as a thousand from the generated list array

const imageWithoutContentQuery = (search, selectedImg) => {
  const stages = [];

  // Stage this by default
  stages.push({
    $match: {
      content: {
        $eq: undefined
      },
      xml_str: {
        $regex: '<MICROSTRUCTURE><ImageFile>' // Check if Image exist first
      }
    }
  });

  if (search.length) {
    search.map((query) => stages.push(query));
  }

  // This logic is used to select a single image. A Mongoose Object ID must be provided in the request.
  if (selectedImg) {
    stages.push({
      $match: {
        _id: mongoose.Types.ObjectId(selectedImg)
      }
    });
  }

  // Add metadata field
  stages.push({
    $addFields: {
      'metaData.title': {
        $arrayElemAt: [
          {
            $split: [
              {
                $arrayElemAt: [
                  { $split: [imgWithoutContentField, '<Control_ID>'] },
                  1
                ]
              },
              '</Control_ID>'
            ]
          },
          0
        ]
      },
      'metaData.sampleId': {
        $arrayElemAt: [
          {
            $split: [
              {
                $arrayElemAt: [{ $split: [imgWithoutContentField, '<ID>'] }, 1]
              },
              '</ID>'
            ]
          },
          0
        ]
      },
      'metaData.id': '$_id',
      'metaData.doi': {
        $arrayElemAt: [
          {
            $split: [
              {
                $arrayElemAt: [{ $split: [imgWithoutContentField, '<DOI>'] }, 1]
              },
              '</DOI>'
            ]
          },
          0
        ]
      },
      prepFile: { $split: [imgWithoutContentField, '<ImageFile><File>'] },
      prepAuthors: { $split: [imgWithoutContentField, '<Author>'] },
      prepKeywords: { $split: [imgWithoutContentField, '<Keyword>'] }
    }
  });

  // Verify above prepped list exist
  stages.push({
    $addFields: {
      keywordsList: {
        $cond: [
          {
            $gt: [
              {
                $size: '$prepKeywords'
              },
              1
            ]
          },
          '$prepKeywords',
          []
        ]
      },
      authorsList: {
        $cond: [
          {
            $gt: [
              {
                $size: '$prepAuthors'
              },
              1
            ]
          },
          '$prepAuthors',
          []
        ]
      }
    }
  });

  // Generate list based on verifed prepped list
  stages.push({
    $addFields: {
      imageFile: {
        $map: {
          input: {
            $slice: ['$prepFile', 2, listCap]
          },
          as: 'currImage',
          in: {
            $arrayElemAt: [
              {
                $split: ['$$currImage', '</File>']
              },
              0
            ]
          }
        }
      },
      'metaData.keywords': {
        $map: {
          input: {
            $slice: ['$keywordsList', 2, listCap]
          },
          as: 'currKeywords',
          in: {
            $arrayElemAt: [
              {
                $split: ['$$currKeywords', '</Keyword>']
              },
              0
            ]
          }
        }
      },
      'metaData.authors': {
        $map: {
          input: {
            $slice: ['$authorsList', 1, listCap]
          },
          as: 'currAuthors',
          in: {
            $arrayElemAt: [
              {
                $split: ['$$currAuthors', '</Author>']
              },
              0
            ]
          }
        }
      }
    }
  });

  stages.push({
    $unwind: {
      path: '$imageFile',
      preserveNullAndEmptyArrays: false
    }
  });

  stages.push({
    $addFields: {
      'image.metaData': '$metaData',
      'image.File': '$imageFile',
      'image.Description': '$title'
    }
  });

  stages.push({
    $project: {
      _id: 0,
      images: '$image'
    }
  });

  return stages;
};

exports.imageQuery = async (args) => {
  const skip = args?.skip ?? 0;
  const limit = args?.limit ?? 20;
  const search = args?.search ?? false;
  const input = args?.input ?? false;
  const selectedImg = args?.selectedImg ?? false;
  const selectImageWithContentQuery = args?.selectedImgWithoutContent ?? false;

  const stages = [];

  if (search.length) {
    search.map((stage) => stages.push(stage));
  }

  // This logic is used to select a single image. A Mongoose Object ID must be provided in the request.
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
        authors: `$${commonFields}.Author`,
        sampleId: '$title'
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
          'image.MicroscopyType': { $regex: input.searchValue, $options: 'gi' }
        }
      });
    }
  }

  // Removing undefined files from result array
  stages.push({
    $match: {
      'image.File': { $not: /undefined/ },
      'image.Description': { $not: /test/ }
    }
  });

  stages.push({
    $project: {
      _id: 0,
      images: '$image'
    }
  });

  const consolidateResponse = async () => {
    return await Xmls.aggregate([
      {
        $facet: {
          withContent: stages,
          withoutContent: imageWithoutContentQuery(
            selectImageWithContentQuery,
            selectedImg
          )
        }
      },
      {
        $project: {
          concantenatedQueryResponse: {
            $concatArrays: ['$withContent', '$withoutContent']
          }
        }
      },
      {
        $project: {
          counts: { $size: '$concantenatedQueryResponse' },
          images: {
            $slice: ['$concantenatedQueryResponse', skip, limit]
          }
        }
      }
    ]);
  };

  const queryResponse = await consolidateResponse();

  if (queryResponse.length) {
    const { counts, images } = queryResponse.pop();
    return { counts, images };
  }
  return { counts: 0, images: [] };
};

exports.validateImageSearchOptions = (input) => {
  const searchQuery = [];
  const search = input?.search;
  const searchValue = input?.searchValue || '';

  if (!searchValue) throw errorFormater('Search value cannot be empty', 422);
  const regex = /(.+?)\s*(and|or)\s*(.+)/i;
  const [, first, conjunction, second] = searchValue.match(regex) || [];
  const operator =
    conjunction && conjunction?.toLowerCase() === 'or' ? '$or' : '$and';

  // Search by year
  if (search === 'filterByYear') {
    if (searchValue.length > 4) {
      throw errorFormater('Year cannot exceed four digits', 422);
    }
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

    if (conjunction) {
      const matchQuery = [
        {
          [fillerFields]: {
            $elemMatch: { ChemicalName: new RegExp(first.trim(), 'gi') }
          }
        },
        {
          [fillerFields]: {
            $elemMatch: { ChemicalName: new RegExp(second.trim(), 'gi') }
          }
        }
      ];

      searchQuery.push({
        $match: {
          [operator]: matchQuery
        }
      });
    } else {
      searchQuery.push({
        $match: {
          [fillerFields]: {
            $elemMatch: { ChemicalName: value }
          }
        }
      });
    }
    return searchQuery;
  }

  // Search by microscopy type
  if (search === 'filterByMicroscopy') {
    const value = new RegExp(searchValue, 'gi');
    searchQuery.push({
      $match: {
        [`${targetField}.MicroscopyType`]: {
          $exists: true
        }
      }
    });

    if (conjunction) {
      const matchQuery = [
        {
          [`${targetField}.MicroscopyType`]: {
            $regex: first.trim(),
            $options: 'gi'
          }
        },
        {
          [`${targetField}.MicroscopyType`]: {
            $regex: second.trim(),
            $options: 'gi'
          }
        }
      ];

      searchQuery.push({
        $match: {
          [operator]: matchQuery
        }
      });
    } else {
      searchQuery.push({
        $match: {
          [`${targetField}.MicroscopyType`]: { $regex: value }
        }
      });
    }
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

    if (conjunction) {
      const matchQuery = [
        {
          [`${commonFields}.DOI`]: { $regex: first.trim(), $options: 'gi' }
        },
        {
          [`${commonFields}.DOI`]: { $regex: second.trim(), $options: 'gi' }
        }
      ];

      searchQuery.push({
        $match: {
          [operator]: matchQuery
        }
      });
    } else {
      searchQuery.push({
        $match: {
          [`${commonFields}.DOI`]: { $regex: searchValue, $options: 'gi' }
        }
      });
    }
    return searchQuery;
  }

  // Search by Sample ID
  if (search === 'filterByID') {
    searchQuery.push({
      $match: {
        title: { $regex: searchValue, $options: 'gi' }
      }
    });
    return searchQuery;
  }

  // Search by sentence
  // const wholeSentence = new RegExp(searchValue, 'gi');
  searchQuery.push({
    $match: {
      [`${commonFields}.Keyword`]: {
        $exists: true
      }
    }
  });

  if (conjunction) {
    const matchQuery = [
      { [`${commonFields}.Keyword`]: { $regex: first.trim(), $options: 'gi' } },
      { [`${commonFields}.Keyword`]: { $regex: second.trim(), $options: 'gi' } }
    ];

    searchQuery.push({
      $match: {
        [operator]: matchQuery
      }
    });
  } else {
    searchQuery.push({
      $match: {
        [`${commonFields}.Keyword`]: { $regex: searchValue, $options: 'gi' }
      }
    });
  }
  return searchQuery;
};

exports.validateImageSearchOptionsForUndefinedContent = (input) => {
  const searchQuery = [];
  const search = input?.search;
  const searchValue = input?.searchValue || '';

  if (!searchValue) throw errorFormater('Search value cannot be empty', 422);

  // If "search" term exist else set searchQuery to empty array so its pipeline query can be ignored at runtime
  if (search) {
    // Search by Sample ID
    switch (search) {
      case 'filterByID':
      case 'Keyword':
        searchQuery.push({
          $match: {
            xml_str: {
              $regex: `<ID>${searchValue}`,
              $options: 'gi'
            }
          }
        });
        break;
      default:
        searchQuery.push({
          $match: {
            xml_str: {
              $eq: undefined
            }
          }
        });
    }
    return searchQuery;
  }

  return searchQuery;
};
