const xmlFormatter = require('xml-formatter');
const XlsxFileManager = require('../../../utils/curation-utility');
const XmlData = require('../../../models/xmlData');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const CuratedSamples = require('../../../models/curatedSamples');
const { curationSearchQuery } = require('../../../pipelines/curation-pipeline');
const { CurationStateSubstitutionMap } = require('../../../../config/constant');

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
        const curationSample = await CuratedSamples.findOne(
          { _id: id },
          { object: 1, user: 1, entityState: 1, curationState: 1 },
          { lean: true }
        );

        if (!curationSample) {
          return errorFormater('curationSample not found', 404);
        }

        let xml = XlsxFileManager.xmlGenerator(
          JSON.stringify({ PolymerNanocomposite: curationSample.object })
        );
        xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${xml}`;

        const title = curationSample.object.Control_ID
          ? curationSample.object.Control_ID.endsWith('.xml')
            ? curationSample.object.Control_ID
            : `${curationSample.object.Control_ID}.xml`
          : curationSample.object.DATA_SOURCE.Citation.CommonFields.Title;
        return {
          id: curationSample._id,
          title,
          xmlString: xml,
          isNewCuration,
          user: curationSample.user,
          status: curationSample.entityState,
          curationState: curationSample.curationState
        };
      } else {
        const xmlData = await XmlData.findOne(
          { _id: id },
          { title: 1, xml_str: 1, iduser: 1, entityState: 1, curateState: 1 },
          { lean: true }
        );

        if (!xmlData) return errorFormater('XmlData not found', 404);
        const xmlString = await xmlFormatter(xmlData.xml_str, {
          collapseContent: true
        });

        return {
          id: xmlData._id,
          title: xmlData.title.endsWith('.xml')
            ? xmlData.title
            : `${xmlData.title}.xml`,
          xmlString,
          isNewCuration,
          user: xmlData.iduser,
          status:
            xmlData.entityState === 'IngestSuccess'
              ? 'Approved'
              : 'Not Approved',
          curationState:
            CurationStateSubstitutionMap[xmlData.curateState] ??
            xmlData.curateState
        };
      }
    } catch (error) {
      req.logger?.error(`[xmlViewer]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = xmlFinderQuery;
