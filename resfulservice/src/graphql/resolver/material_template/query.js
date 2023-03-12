const MaterialTemplate = require('../../../models/xlsxCurationList');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

const materialQuery = {
  getXlsxCurationList: async (_, { input }, { req, isAuthenticated }) => {
    req.logger?.info('[getMaterialColumns] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[getMaterialColumns]: User not authenticated to view material column listing');
      return errorFormater('not authenticated', 401);
    }
    const { field, pageSize, pageNumber } = input;
    const filter = field ? { field: { $regex: new RegExp(field.toString(), 'gi') } } : {};
    try {
      const pagination = pageSize || pageNumber ? paginator(await MaterialTemplate.countDocuments(filter), pageNumber, pageSize) : paginator(await MaterialTemplate.countDocuments(filter));
      const curatedList = await MaterialTemplate.find(filter, null, { lean: true, populate: { path: 'user', select: 'displayName' } });
      return Object.assign(pagination, { columns: curatedList.map((list) => ({ ...list, user: list?.user?.displayName })) });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = materialQuery;
