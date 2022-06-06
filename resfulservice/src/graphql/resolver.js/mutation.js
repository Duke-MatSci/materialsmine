const ApiAccess = require('../../models/apiAccess');
const User = require('../../models/user');
const isEmail = require('../../utils/isEmail');
const errorFormater = require('../../utils/graphQlErrorFormatter');
const { signToken } = require('../../utils/jwtService');

const Mutation = {
  createAPIAccess: async (parent, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createAPIAccess Function Entry:', user._id);
    if (!isAuthenticated) {
      return errorFormater('Not Authenticated', 401);
    }
    const token = signToken({ timer: 0, env: { TKNS: input.key } }, { userId: user._id });
    const apiAccess = ApiAccess({ user: user._id, key: input.key, token });

    try {
      await apiAccess.save();
      return apiAccess;
    } catch (error) {
      req.logger.error(error);
      return errorFormater('Internal Server Error', 500);
    }
  },

  createUser: async (parent, { input }, { req, isAuthenticated }) => {
    req.logger.info('createUser Function Entry:');
    if (!isEmail(input.email)) return errorFormater('invalid email address', 403);
    if ((await User.countDocuments({ email: input.email })) >= 1) return errorFormater('email already exist', 403);
    if ((await User.countDocuments({ userId: input.userId })) >= 1) return errorFormater('userId already exist', 403);

    const user = User(input);
    try {
      await user.save();
      return user;
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },
  updateUser: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('updateUser Function Entry:', user._id);
    if (!isAuthenticated) throw errorFormater('not authentiacted', 401);

    try {
      const oldRecord = await User.findOne({ _id: input._id }).lean();
      if (!oldRecord) return errorFormater('user not found', 404);

      await User.findOneAndUpdate({ _id: input._id }, { $set: input });

      // updated record
      return User.findOne({ _id: input._id }).lean();
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },
  deleteUser: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('deleteUser Function Entry:', user._id);
    if (!isAuthenticated) throw errorFormater('not authentiacted', 401);
    try {
      const oldRecord = await User.findOne({ _id: input._id }).lean();
      if (!oldRecord) {
        return errorFormater('user not found', 404);
      }

      return User.findOneAndDelete(input).lean();
    } catch (error) {
      return errorFormater(error.message, 400);
    }
  },
  createToken: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('createToken Function Entry:', user._id);
    if (!isAuthenticated) return errorFormater('not authentiacted', 401);
    try {
      return { token: signToken(req, { id: input._id }), createtedAt: new Date().toUTCString(), duration: '8h' };
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = Mutation;
