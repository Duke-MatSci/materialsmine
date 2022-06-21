const ApiAccess = require('../../../models/apiAccess');
const errorFormater = require('../../../utils/errorFormater');
const { signToken } = require('../../../utils/jwtService');

const apiAccessMutation = {
  createAPIAccess: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createAPIAccess Function Entry:', user._id);

    if (!isAuthenticated) return errorFormater('Not Authenticated', 401);

    try {
      const token = signToken({ timer: 0, env: { TKNS: input.key } }, { userId: user._id });
      const apiAccess = ApiAccess({ user: user._id, key: input.key, token });

      await apiAccess.save();
      return apiAccess;
    } catch (error) {
      req.logger.error(error);
      return errorFormater('Internal Server Error', 500);
    }
  }
};

module.exports = apiAccessMutation;
