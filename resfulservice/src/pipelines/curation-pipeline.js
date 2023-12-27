const { Types: { ObjectId } } = require('mongoose');
const XmlData = require('../models/xmlData');
const { CurationStateSubstitutionMap } = require('../../config/constant');

exports.curationSearchQuery = async (input) => {
  const status = input?.filter?.status;
  const param = input?.filter?.param;
  const isNewCuration = input?.filter?.isNewCuration;
  const curationState = input?.filter?.curationState;
  const user = input?.filter?.user;
  const xmlDataFilter = param ? { title: { $regex: new RegExp(param.toString(), 'gi') } } : {};
  const curationSampleFilter = param ? { 'object.DATA_SOURCE.Citation.CommonFields.Title': { $regex: new RegExp(param.toString(), 'gi') } } : {};

  if (curationState) {
    xmlDataFilter.curateState = curationState;
    curationSampleFilter.curationState = CurationStateSubstitutionMap[curationState];
  }

  if (user) {
    xmlDataFilter.iduser = ObjectId.isValid(user) ? ObjectId(user) : user;
    curationSampleFilter.user = ObjectId.isValid(user) ? ObjectId(user) : user;
  }

  const filter = {};
  const pageNumber = input?.pageNumber ? parseInt(input?.pageNumber, 10) : 1;
  const pageSize = input?.pageSize ? parseInt(input?.pageSize, 10) : 20;
  const skip = ((pageNumber - 1) * pageSize);
  if (status) filter.status = status.replace('_', ' ');
  if (typeof isNewCuration === 'boolean') filter.isNewCuration = isNewCuration;

  const data = await XmlData.aggregate([
    { $match: xmlDataFilter },
    {
      $project: {
        id: '$_id',
        title: 1,
        sequence: '$dsSeq',
        isNewCuration: { $literal: false },
        status: {
          $cond: [{ $eq: ['$entityState', 'IngestSuccess'] }, 'Approved', 'Not Approved']
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
              title: { $ifNull: ['$object.DATA_SOURCE.Citation.CommonFields.Title', '$object.Control_ID'] },
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
    { $project: { _id: 0, count: 1, xmlData: { $slice: ['$xmlData', skip, pageSize] } } }
  ]);
  const xmlData = data[0]?.xmlData ?? [];
  const count = data[0]?.count ?? 0;
  return { xmlData, count };
};
