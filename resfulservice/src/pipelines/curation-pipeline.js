const {
  Types: { ObjectId }
} = require('mongoose');
const XmlData = require('../models/xmlData');
const { CurationStateSubstitutionMap } = require('../../config/constant');

exports.curationSearchQuery = async (input) => {
  const status = input?.filter?.status;
  const param = input?.filter?.param;
  const isNewCuration = input?.filter?.isNewCuration;
  const curationState = input?.filter?.curationState;
  const user = input?.filter?.user;
  const author = input?.filter?.author;
  const xmlDataFilter = param
    ? { title: { $regex: new RegExp(param.toString(), 'gi') } }
    : {};
  const curationSampleFilter = param
    ? {
        'object.DATA_SOURCE.Citation.CommonFields.Title': {
          $regex: new RegExp(param.toString(), 'gi')
        }
      }
    : {};

  if (curationState) {
    xmlDataFilter.curateState = curationState;
    curationSampleFilter.curationState =
      CurationStateSubstitutionMap[curationState];
  }

  if (author) {
    xmlDataFilter[
      'content.PolymerNanocomposite.DATA_SOURCE.Citation.CommonFields.Author'
    ] = {
      $elemMatch: { $regex: new RegExp(author.toString(), 'gi') }
    };
    curationSampleFilter['object.DATA_SOURCE.Citation.CommonFields.Author'] = {
      $elemMatch: { $regex: new RegExp(author.toString(), 'gi') }
    };
  }

  if (user) {
    xmlDataFilter.iduser = ObjectId.isValid(user) ? ObjectId(user) : user;
    curationSampleFilter.user = ObjectId.isValid(user) ? ObjectId(user) : user;
  }

  const filter = {};
  const pageNumber = input?.pageNumber ? parseInt(input?.pageNumber, 10) : 1;
  const pageSize = input?.pageSize ? parseInt(input?.pageSize, 10) : 20;
  const skip = (pageNumber - 1) * pageSize;
  if (status) filter.status = status.replace('_', ' ');
  if (typeof isNewCuration === 'boolean') filter.isNewCuration = isNewCuration;

  const authorRegex = author
    ? new RegExp(`<Author>\\s*${author}\\b[^<]*</Author>`, 'gi')
    : null;

  const xmlDataFacet = {
    xmlDataFilterPipeline: [{ $match: xmlDataFilter }]
  };

  if (authorRegex) {
    const noContentMatch = {
      content: { $eq: null },
      xml_str: { $regex: authorRegex }
    };

    if (param) {
      noContentMatch.title = { $regex: new RegExp(param.toString(), 'gi') };
    }

    xmlDataFacet.noContentPipeline = [{ $match: noContentMatch }];
  }

  const data = await XmlData.aggregate([
    { $facet: xmlDataFacet },
    {
      $project: {
        combinedResults: {
          $concatArrays: authorRegex
            ? ['$xmlDataFilterPipeline', '$noContentPipeline']
            : ['$xmlDataFilterPipeline']
        }
      }
    },
    { $unwind: '$combinedResults' },
    { $replaceRoot: { newRoot: '$combinedResults' } },
    {
      $project: {
        id: '$_id',
        title: {
          $cond: {
            if: { $not: { $regexMatch: { input: '$title', regex: /\.xml$/ } } },
            then: { $concat: ['$title', '.xml'] },
            else: '$title'
          }
        },
        sequence: '$dsSeq',
        isNewCuration: { $literal: false },
        status: {
          $cond: [
            { $eq: ['$entityState', 'IngestSuccess'] },
            'Approved',
            'Not Approved'
          ]
        },
        user: '$iduser'
      }
    },
    {
      $unionWith: {
        coll: 'curatedsamples',
        pipeline: [
          { $match: curationSampleFilter },
          {
            $project: {
              id: '$_id',
              title: {
                $cond: {
                  if: { $ne: ['$object.Control_ID', null] },
                  then: {
                    $cond: {
                      if: {
                        $regexMatch: {
                          input: '$object.Control_ID',
                          regex: /\.xml$/
                        }
                      },
                      then: '$object.Control_ID',
                      else: { $concat: ['$object.Control_ID', '.xml'] }
                    }
                  },
                  else: '$object.DATA_SOURCE.Citation.CommonFields.Title'
                }
              },
              object: 1,
              isNewCuration: { $literal: true },
              status: '$entityState',
              user: 1
            }
          }
        ]
      }
    },
    { $match: filter },
    { $group: { _id: null, count: { $sum: 1 }, xmlData: { $push: '$$ROOT' } } },
    {
      $project: {
        _id: 0,
        count: 1,
        xmlData: { $slice: ['$xmlData', skip, pageSize] }
      }
    }
  ]);
  const xmlData = data[0]?.xmlData ?? [];
  const count = data[0]?.count ?? 0;
  return { xmlData, count };
};
