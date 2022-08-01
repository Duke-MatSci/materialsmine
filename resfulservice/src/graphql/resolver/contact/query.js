const Contact = require('../../../models/contact');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

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
    if (!isAuthenticated) {
      req.logger?.error('[contacts]: User not authenticated to view contact listing');
      return errorFormater('not authenticated', 401);
    }
    const filter = input?.datetime?.from && input?.datetime?.to
      ? {
          createdAt: {
            $gt: new Date(input.datetime.from),
            $lt: new Date(input.datetime.to)
          }
        }
      : {};
    try {
      const pagination = input ? paginator(await Contact.countDocuments({}), input.pageNumber, input.pageSize) : paginator(await Contact.countDocuments({}));
      const data = await Contact.find(filter).skip(pagination.skip).limit(pagination.limit).lean();
      return Object.assign(pagination, { data });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = contactQuery;
