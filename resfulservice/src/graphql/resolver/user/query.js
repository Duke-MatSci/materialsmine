const User = require('../../../models/user');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

const userQuery = {
  user: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createAPIAccess Function Entry:', user._id);
    if (!isAuthenticated) return errorFormater('Not authenticated', 401);
    try {
      const user = await User.findOne(input, {}, { lean: true });
      if (!user) return errorFormater('user not found', 404);
      return user;
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },

  users: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[users]: Function entry');
    if (!isAuthenticated) {
      req.logger?.error('[users]: User not authenticated to view user listing');
      return errorFormater('Not authenticated', 401);
    }
    try {
      const filter = input?.displayName ? { displayName: { $regex: new RegExp(`^${input.displayName}`, 'gi') } } : {};
      const pagination = input ? paginator(await User.countDocuments(filter), input.pageNumber, input.pageSize) : paginator(await User.countDocuments(filter));
      const data = await User.find(filter, null, { skip: pagination.skip, limit: pagination.limit, lean: true });
      return Object.assign(pagination, { data });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },

  verifyUser: (_, _input, { user, req, isAuthenticated }) => {
    req.logger.info('verifyUser Function Entry:', user._id);
    if (!isAuthenticated) return errorFormater('Not authenticated', 401);
    return { user: { id: user._id, username: user.displayName }, isAuth: isAuthenticated, token: req.headers.authorization };
  }
};

module.exports = userQuery;
