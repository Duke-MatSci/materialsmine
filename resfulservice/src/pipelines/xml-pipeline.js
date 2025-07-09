const { default: mongoose } = require('mongoose');

// This module exports a function that generates a MongoDB aggregation pipeline for loading new XML viscoelastic properties from a database.
exports.loadViscoelasticPropPipeline = (options) => {
  const { has, id, includeRows = false, page = 1, size = 2 } = options;

  if (!id && !has) {
    throw new Error('Either id or has property must be provided');
  }

  if (has && !['frequency', 'temperature'].includes(has.toLowerCase())) {
    throw new Error('Invalid has value. Must be "frequency" or "temperature".');
  }

  const skip = (page - 1) * size;

  const stage = [];
  stage.push(
    {
      $unwind:
        '$object.PROPERTIES.Viscoelastic.DynamicProperties.DynamicPropertyProfile'
    },
    {
      $addFields: {
        profile:
          '$object.PROPERTIES.Viscoelastic.DynamicProperties.DynamicPropertyProfile',
        title: '$object.DATA_SOURCE.Citation.CommonFields.Title'
      }
    },
    {
      $addFields: {
        firstColumn: {
          $arrayElemAt: ['$profile.data.headers.column', 0]
        },
        secondColumn: {
          $arrayElemAt: ['$profile.data.headers.column', 1]
        }
      }
    }
  );
  if (has) {
    stage.push(
      {
        $addFields: {
          firstColumnText: { $toLower: '$firstColumn._text' },
          secondColumnText: '$secondColumn._text'
        }
      },
      {
        $match: {
          firstColumnText: has.toLowerCase()
        }
      }
    );
  } else {
    stage.push({ $match: { _id: mongoose.Types.ObjectId(id) } });
  }
  return [
    ...stage,
    {
      $project: {
        _id: 1,
        title: 1,
        property: '$profile.description',
        table: {
          $concat: ['$firstColumn._text', ' vs ', '$secondColumn._text']
        },
        ...(includeRows && {
          rows: '$profile.data.rows.row'
        })
      }
    },
    // Group profiles back under title
    {
      $group: {
        _id: {
          docId: '$_id',
          title: '$title'
        },
        contains: {
          $push: {
            property: '$property',
            table: '$table',
            ...(includeRows && { rows: '$rows' })
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        id: '$_id.docId',
        title: '$_id.title',
        contains: 1
      }
    },
    // Pagination support
    {
      $facet: {
        pagedResults: [{ $skip: skip }, { $limit: size }],
        totalCount: [{ $count: 'counts' }]
      }
    },
    {
      $project: {
        counts: {
          $ifNull: [{ $arrayElemAt: ['$totalCount.counts', 0] }, 0]
        },
        xmls: '$pagedResults'
      }
    }
  ];
};

// This module exports a function that generates a MongoDB aggregation pipeline for loading old XML properties from a database.
exports.loadXmlProperty = (has, page, limit, matchOpt) => {
  const stage = [];
  if (has) {
    stage.push({
      $match: {
        xml_str: {
          $regex: `<column id="[01]">${has}`,
          $options: 'i'
        }
      }
    });
  }
  if (matchOpt) {
    stage.push(
      {
        $match: {
          xml_str: {
            $regex: matchOpt
          }
        }
      },
      {
        $match: {
          xml_str: {
            $regex: `<column id="[01]">${has}`,
            $options: 'i'
          }
        }
      }
    );
  }
  stage.push({
    $group: {
      _id: null,
      docs: {
        $push: {
          title: '$title',
          xml: '$xml_str'
        }
      }
    }
  });
  stage.push({
    $project: {
      _id: 0,
      counts: { $size: '$docs' },
      xmls: {
        $slice: ['$docs', (page - 1) * limit, limit]
      }
    }
  });
  return stage;
};
