const mongoose = require('mongoose');
const Xmls = require('../models/xmlData');
const errorFormater = require('../utils/errorFormater');

// Targets old curation sample collection fields
const targetField = 'content.PolymerNanocomposite.MICROSTRUCTURE.ImageFile';
const commonFields =
  'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields';
const fillerFields =
  'content.PolymerNanocomposite.MATERIALS.Filler.FillerComponent';
const imgWithoutContentField = '$xml_str';

// Targets new curation sample collection fields
const newSampleTargetField = 'object.MICROSTRUCTURE.ImageFile';
const newSampleCommonFields = 'object.DATA_SOURCE.Citation.CommonFields';
const newSampleFillerFields = 'object.MATERIALS.Filler.FillerComponent';

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
      imageFiles: {
        $map: {
          input: {
            $slice: ['$prepFile', 0, listCap]
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
    $addFields: {
      imageFile: {
        $filter: {
          input: '$imageFiles',
          as: 'urlLinks',
          cond: {
            $regexMatch: {
              input: '$$urlLinks',
              // Old xml files are stored in mongo with this prefix
              regex: 'http://localhost/nmr',
              options: 'i'
            }
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

  const stages = []; // Old xml collection sample stage
  const newSampleStages = []; // New sample stage

  if (search && search.searchQuery?.length) {
    const { newSampleSearchQuery, searchQuery: oldSampleSearchQuery } = search;
    oldSampleSearchQuery.map((queries) => stages.push(queries));
    newSampleSearchQuery.map((queries) => newSampleStages.push(queries));
  }

  // This logic is used to select a single image. A Mongoose Object ID must be provided in the request.
  if (selectedImg) {
    stages.push({
      $match: {
        _id: mongoose.Types.ObjectId(selectedImg)
      }
    });

    newSampleStages.push({
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

  newSampleStages.push({
    $match: {
      [newSampleTargetField]: {
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

  newSampleStages.push({
    $unwind: {
      path: `$${newSampleTargetField}`,
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

  newSampleStages.push({
    $addFields: {
      [`${newSampleTargetField}.metaData`]: {
        title: `$${newSampleCommonFields}.Title`,
        id: '$_id',
        doi: `$${newSampleCommonFields}.DOI`,
        keywords: `$${newSampleCommonFields}.Keyword`,
        authors: `$${newSampleCommonFields}.Author`,
        sampleId: '$object.Control_ID'
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

  newSampleStages.push({
    $group: {
      _id: 'null',
      image: {
        $push: `$${newSampleTargetField}`
      }
    }
  });

  stages.push({
    $unwind: {
      path: '$image',
      preserveNullAndEmptyArrays: false
    }
  });

  newSampleStages.push({
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

      newSampleStages.push({
        $match: {
          'image.MicroscopyType': {
            $regex: input.searchValue,
            $options: 'gi'
          }
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

  newSampleStages.push({
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

  newSampleStages.push({
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
        $lookup: {
          from: 'curatedsamples',
          let: {},
          pipeline: [
            { $facet: { withContent: newSampleStages } },
            { $unwind: '$withContent' }, // Flatten the nested array
            { $replaceRoot: { newRoot: '$withContent' } }
          ],
          as: 'newSamplesWithContent'
        }
      },
      {
        $project: {
          concantenatedQueryResponse: {
            $concatArrays: [
              '$withContent',
              '$withoutContent',
              '$newSamplesWithContent'
            ]
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
  const newSampleSearchQuery = [];
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

    // Push Similar for new curation pipeline
    newSampleSearchQuery.push({
      $match: {
        [`${newSampleCommonFields}.PublicationYear`]: {
          $exists: true
        }
      }
    });
    newSampleSearchQuery.push({
      $match: {
        [`${newSampleCommonFields}.PublicationYear`]: parseInt(searchValue)
      }
    });
    return { searchQuery, newSampleSearchQuery };
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

    newSampleSearchQuery.push({
      // Push Similar for new curation pipeline
      $match: {
        [`${newSampleFillerFields}`]: {
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

      // Push Similar for new curation pipeline
      const newSampleMatchQuery = [
        {
          [`${newSampleFillerFields}`]: {
            $elemMatch: { ChemicalName: new RegExp(first.trim(), 'gi') }
          }
        },
        {
          [`${newSampleFillerFields}`]: {
            $elemMatch: { ChemicalName: new RegExp(second.trim(), 'gi') }
          }
        }
      ];

      newSampleSearchQuery.push({
        $match: {
          [operator]: newSampleMatchQuery
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

      newSampleSearchQuery.push({
        // Push Similar for new curation pipeline
        $match: {
          [`${newSampleFillerFields}`]: {
            $elemMatch: { ChemicalName: value }
          }
        }
      });
    }

    return { searchQuery, newSampleSearchQuery };
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

    // Push Similar for new curation pipeline
    newSampleSearchQuery.push({
      $match: {
        [`${newSampleTargetField}.MicroscopyType`]: {
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

      // Push Similar for new curation pipeline
      const newSampleMatchQuery = [
        {
          [`${newSampleTargetField}.MicroscopyType`]: {
            $regex: first.trim(),
            $options: 'gi'
          }
        },
        {
          [`${newSampleTargetField}.MicroscopyType`]: {
            $regex: second.trim(),
            $options: 'gi'
          }
        }
      ];

      newSampleSearchQuery.push({
        $match: {
          [operator]: newSampleMatchQuery
        }
      });
    } else {
      searchQuery.push({
        $match: {
          [`${targetField}.MicroscopyType`]: { $regex: value }
        }
      });

      // Push Similar for new curation pipeline
      newSampleSearchQuery.push({
        $match: {
          [`${newSampleTargetField}.MicroscopyType`]: { $regex: value }
        }
      });
    }
    return { searchQuery, newSampleSearchQuery };
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

    // Push Similar for new curation pipeline
    newSampleSearchQuery.push({
      $match: {
        [`${newSampleCommonFields}.DOI`]: {
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

      // Push Similar for new curation pipeline
      const newSampleMatchQuery = [
        {
          [`${newSampleCommonFields}.DOI`]: {
            $regex: first.trim(),
            $options: 'gi'
          }
        },
        {
          [`${newSampleCommonFields}.DOI`]: {
            $regex: second.trim(),
            $options: 'gi'
          }
        }
      ];

      newSampleSearchQuery.push({
        $match: {
          [operator]: newSampleMatchQuery
        }
      });
    } else {
      searchQuery.push({
        $match: {
          [`${commonFields}.DOI`]: { $regex: searchValue, $options: 'gi' }
        }
      });

      // Push Similar for new curation pipeline
      newSampleSearchQuery.push({
        $match: {
          [`${newSampleCommonFields}.DOI`]: {
            $regex: searchValue,
            $options: 'gi'
          }
        }
      });
    }
    return { searchQuery, newSampleSearchQuery };
  }

  // Search by Sample ID
  if (search === 'filterByID') {
    searchQuery.push({
      $match: {
        title: { $regex: searchValue, $options: 'gi' }
      }
    });

    // Push Similar for new curation pipeline
    newSampleSearchQuery.push({
      $match: {
        'object.Control_ID': { $regex: searchValue, $options: 'gi' }
      }
    });
    return { searchQuery, newSampleSearchQuery };
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

  // Push Similar Search by sentence for new curation pipeline
  newSampleSearchQuery.push({
    $match: {
      [`${newSampleCommonFields}.Keyword`]: {
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

    // Push Similar for new curation pipeline
    const newSampleMatchQuery = [
      {
        [`${newSampleCommonFields}.Keyword`]: {
          $regex: first.trim(),
          $options: 'gi'
        }
      },
      {
        [`${newSampleCommonFields}.Keyword`]: {
          $regex: second.trim(),
          $options: 'gi'
        }
      }
    ];

    newSampleSearchQuery.push({
      $match: {
        [operator]: newSampleMatchQuery
      }
    });
  } else {
    searchQuery.push({
      $match: {
        [`${commonFields}.Keyword`]: { $regex: searchValue, $options: 'gi' }
      }
    });

    // Push Similar for new curation pipeline
    newSampleSearchQuery.push({
      $match: {
        [`${newSampleCommonFields}.Keyword`]: {
          $regex: searchValue,
          $options: 'gi'
        }
      }
    });
  }
  return { searchQuery, newSampleSearchQuery };
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
