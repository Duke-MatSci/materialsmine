const User = require('../../models/user');
const errorFormater = require('../../utils/graphQlErrorFormatter');
const paginator = require('../../utils/paginator');

const Query = {
  user: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createAPIAccess Function Entry:', user._id);
    if (!isAuthenticated) throw errorFormater('not authentiacted', 401);
    return await User.findOne(input).lean();
  },
  users: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createAPIAccess Function Entry:', user._id);
    if (!isAuthenticated) throw errorFormater('not authentiacted', 401);
    const pagination = input ? paginator(await User.countDocuments({}), input.pageNumber, input.pageSize) : paginator(await User.countDocuments({}));
    const data = await User.find({}).skip(pagination.skip).limit(pagination.limit).lean();
    return Object.assign(pagination, { data });
  }
};

module.exports = Query;
