const { userRoles } = require('../../../../config/constant');
const User = require('../../../models/user');
const errorFormater = require('../../../utils/errorFormater');

const userMutation = {
  updateUser: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('updateUser Function Entry:', user._id);
    if (!isAuthenticated) return errorFormater('not authenticated', 401);

    try {
      if (input.roles && user.roles !== userRoles.isAdmin) return errorFormater('Only admin can upgrade user roles', 409);
      const updatedUser = await User.findOneAndUpdate({ _id: input._id }, { $set: input }, { lean: true, new: true });
      if (!updatedUser) return errorFormater('user not found', 404);
      return updatedUser;
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  },

  deleteUser: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('deleteUser Function Entry:', user._id);
    if (!isAuthenticated) return errorFormater('not authenticated', 401);
    try {
      if (user.roles !== userRoles.isAdmin) return errorFormater('Only admin can delete users', 409);
      const { deletedCount } = await User.deleteMany({ _id: { $in: input.ids } });

      return Boolean(deletedCount);
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = userMutation;
