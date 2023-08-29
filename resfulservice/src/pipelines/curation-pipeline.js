const { Types: { ObjectId } } = require('mongoose');
const XmlData = require('../models/xmlData');

exports.curationSearchQuery = async (input) => {
  const status = input?.filter?.status;
  const param = input?.filter?.param;
  const isNewCuration = input?.filter?.isNewCuration;
  const curationState = input?.filter?.curationState;
  const user = input?.filter?.user;
  const xmlDataFilter = param ? { title: { $regex: new RegExp(param.toString(), 'gi') } } : {};
  const curationSampleFilter = param ? { 'object.DATA_SOURCE.Citation.CommonFields.Title': { $regex: new RegExp(param.toString(), 'gi') } } : {};

  if (curationState) xmlDataFilter.curateState = curationState;
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

  const xmlData = await XmlData.aggregate([
    { $match: xmlDataFilter },
    {
      $project: {
        id: '$_id',
        title: 1,
        sequence: '$dsSeq',
        isNewCuration: { $literal: false },
        status: {
          $cond: [{ $eq: ['$entityState', 'IngestSuccess'] }, 'Approved', 'Not Approved']
        }
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
              status: '$entityState'
            }
          }
        ]
      }
    },
    { $match: filter },
    { $skip: skip },
    { $limit: pageSize }
  ]);

  return { xmlData, count: xmlData.length };
};
