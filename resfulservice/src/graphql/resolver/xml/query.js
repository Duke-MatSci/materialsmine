const xmlFormatter = require('xml-formatter');
const XmlData = require('../../../models/xmlData');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

const xmlFinderQuery = {
  xmlFinder: async (_, { input }, { req }) => {
    req.logger?.info('[xmlFinder] Function Entry');
    try {
      const filter = input?.param ? { title: { $regex: new RegExp(input.param.toString(), 'gi') } } : {};
      const pagination = paginator(await XmlData.countDocuments(filter), input?.pageNumber, input?.pageSize);

      const xmlData = await XmlData.aggregate([
        { $match: filter },
        { $project: { id: '$_id', title: 1, entityState: 1, sequence: '$dsSeq' } },
        { $sort: { entityState: 1 } },
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
    const { id } = input;
    try {
      const xmlData = await XmlData.findOne({ _id: id }, { title: 1, xml_str: 1 }, { lean: true });
      if (!xmlData) return errorFormater('XmlData not found', 404);
      const xmlString = await xmlFormatter(xmlData.xml_str, { collapseContent: true });
      return { id: xmlData._id, title: xmlData.title, xmlString };
    } catch (error) {
      req.logger?.error(`[xmlViewer]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = xmlFinderQuery;
