const Contact = require('../../../models/contact');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');
const { userRoles } = require('../../../../config/constant');

const contactQuery = {
  getUserContacts: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[getUserContacts] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[contacts]: User not authenticated to view contact listing');
      return errorFormater('not authenticated', 401);
    }
    try {
      const pagination = paginator(await Contact.countDocuments(input));
      const data = await Contact.find(input).lean();
      return Object.assign(pagination, { data });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },

  contacts: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[contacts]: Function Entry:');
    const { datetime, resolvedBy, resolved } = input;
    if (user?.roles !== userRoles.isAdmin || !isAuthenticated) {
      req.logger?.error('[contacts]: User not authenticated to view contact listing');
      return errorFormater('not authenticated', 401);
    }
    const filter = resolved ? { resolved } : { $or: [{ resolved }, { resolved: null }] };
    if (datetime?.from && datetime?.to) filter.createdAt = { $gt: new Date(input.datetime.from), $lt: new Date(input.datetime.to) };
    if (resolvedBy) filter.resolvedBy = resolvedBy;
    try {
      const pagination = input ? paginator(await Contact.countDocuments(filter), input.pageNumber, input.pageSize) : paginator(await Contact.countDocuments(filter));
      const data = await Contact.find(filter).skip(pagination.skip).limit(pagination.limit).lean();
      return Object.assign(pagination, { data });
    } catch (error) {
      req.logger.error(error);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = contactQuery;
