const mongoose = require('mongoose');
const xmlFormatter = require('xml-formatter');
const XlsxFileManager = require('../../../utils/curation-utility');
const XmlData = require('../../../models/xmlData');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const CuratedSamples = require('../../../models/curatedSamples');

const xmlFinderQuery = {
  xmlFinder: async (_, { input }, { req }) => {
    req.logger?.info('[xmlFinder] Function Entry');
    try {
      const status = input?.filter?.status;
      const param = input?.filter?.param;
      const isNewCuration = input?.filter?.isNewCuration;
      const curationState = input?.filter?.curationState;
      const user = input?.filter?.user;
      const xmlDataFilter = param ? { title: { $regex: new RegExp(param.toString(), 'gi') } } : {};
      const curationSampleFilter = param ? { 'object.DATA_SOURCE.Citation.CommonFields.Title': { $regex: new RegExp(param.toString(), 'gi') } } : {};

      if (curationState) xmlDataFilter.curateState = curationState;
      if (user) {
        xmlDataFilter.user = mongoose.Types.ObjectId(user);
        curationSampleFilter.user = mongoose.Types.ObjectId(user);
      }

      const filter = {};

      if (status) filter.status = status.replace('_', ' ');
      if (typeof isNewCuration === 'boolean') filter.isNewCuration = isNewCuration;

      const [xmlDataCount, curationSampleCount] = await Promise.all([
        XmlData.countDocuments(xmlDataFilter),
        CuratedSamples.countDocuments(curationSampleFilter)
      ]);

      const pagination = paginator(xmlDataCount + curationSampleCount, input?.pageNumber, input?.pageSize);

      // TODO (@tee) Will move this into the pipeline folder later
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
                  title: '$object.DATA_SOURCE.Citation.CommonFields.Title',
                  object: 1,
                  isNewCuration: { $literal: true },
                  status: '$entityState'
                }
              }
            ]
          }
        },
        { $match: filter },
        { $skip: pagination.skip },
        { $limit: pagination.pageSize }
      ]);

      return Object.assign(pagination, { xmlData });
    } catch (error) {
      req.logger?.error(`[xmlFinder]: ${error}`);
      return errorFormater(error.message, 500);
    }
  },

  xmlViewer: async (_, { input }, { req }) => {
    req.logger?.info('[xmlViewer] Function Entry');
    const { id, isNewCuration } = input;
    try {
      if (isNewCuration) {
        const curationSample = await CuratedSamples.findOne({ _id: id }, { object: 1 }, { lean: true });

        if (!curationSample) return errorFormater('curationSample not found', 404);
        let xml = XlsxFileManager.xmlGenerator(JSON.stringify({ PolymerNanocomposite: curationSample.object }));
        xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${xml}`;

        return { id: curationSample._id, title: curationSample.object.DATA_SOURCE.Citation.CommonFields.Title, xmlString: xml };
      } else {
        const xmlData = await XmlData.findOne({ _id: id }, { title: 1, xml_str: 1 }, { lean: true });

        if (!xmlData) return errorFormater('XmlData not found', 404);
        const xmlString = await xmlFormatter(xmlData.xml_str, { collapseContent: true });

        return { id: xmlData._id, title: xmlData.title, xmlString };
      }
    } catch (error) {
      req.logger?.error(`[xmlViewer]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = xmlFinderQuery;
