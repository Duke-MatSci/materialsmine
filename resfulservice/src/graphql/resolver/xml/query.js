const xmlFormatter = require('xml-formatter');
const XlsxFileManager = require('../../../utils/curation-utility');
const XmlData = require('../../../models/xmlData');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const CuratedSamples = require('../../../models/curatedSamples');
const { curationSearchQuery } = require('../../../pipelines/curation-pipeline');

const xmlFinderQuery = {
  xmlFinder: async (_, { input }, { req }) => {
    req.logger?.info('[xmlFinder] Function Entry');
    try {
      const { xmlData, count } = await curationSearchQuery(input);
      const pagination = paginator(count, input?.pageNumber, input?.pageSize);
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
        const curationSample = await CuratedSamples.findOne({ _id: id }, { object: 1, user: 1 }, { lean: true });

        if (!curationSample) return errorFormater('curationSample not found', 404);

        let xml = XlsxFileManager.xmlGenerator(JSON.stringify({ PolymerNanocomposite: curationSample.object }));
        xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${xml}`;

        return {
          id: curationSample._id,
          title: curationSample.object.DATA_SOURCE.Citation.CommonFields.Title,
          xmlString: xml,
          isNewCuration,
          user: curationSample.user
        };
      } else {
        const xmlData = await XmlData.findOne({ _id: id }, { title: 1, xml_str: 1, iduser: 1 }, { lean: true });

        if (!xmlData) return errorFormater('XmlData not found', 404);
        const xmlString = await xmlFormatter(xmlData.xml_str, { collapseContent: true });

        return {
          id: xmlData._id,
          title: xmlData.title,
          xmlString,
          isNewCuration,
          user: xmlData.iduser
        };
      }
    } catch (error) {
      req.logger?.error(`[xmlViewer]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = xmlFinderQuery;
