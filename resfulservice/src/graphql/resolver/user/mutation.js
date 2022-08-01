const User = require('../../../models/user');
const errorFormater = require('../../../utils/errorFormater');

const userMutation = {
  createUser: async (_, { input }, { req }) => {
    req.logger.info('createUser Function Entry:');

    if (!/\S+@\S+\.\S+/.test(input.email)) return errorFormater('invalid email', 403);

    if ((await User.countDocuments({ email: input.email })) >= 1) return errorFormater('email already exist', 409);

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
    if (!isAuthenticated) return errorFormater('not authentiacted', 401);

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
    if (!isAuthenticated) return errorFormater('not authentiacted', 401);
    try {
      const oldRecord = await User.findOne({ _id: input._id }).lean();
      if (!oldRecord) {
        return errorFormater('user not found', 404);
      }

      return User.findOneAndDelete(input).lean();
    } catch (error) {
      return errorFormater(error.message, 400);
    }
  }
};

module.exports = userMutation;
