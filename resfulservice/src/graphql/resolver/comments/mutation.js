const Comment = require('../../../models/comment');
const errorFormater = require('../../../utils/errorFormater');

const commentMutation = {
  postComment: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[postComment] Function Entry:');

    if (!isAuthenticated) {
      req.logger?.error('[postComment]: User not authenticated to post comment');
      return errorFormater('not authenticated', 401);
    }

    try {
      const comment = new Comment({ ...input, user: user._id });
      await (await comment.save()).populate({ path: 'user', select: 'givenName surName' });

      return comment;
    } catch (error) {
      req.logger?.error(`[postComment]: ${error}`);
      return errorFormater(error.message, 500);
    }
  },

  editComment: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[editComment] Function Entry:');

    if (!isAuthenticated) {
      req.logger?.error('[editComment]: User not authenticated to edit comment');
      return errorFormater('not authenticated', 401);
    }

    const { id, ...commentUpdate } = input;

    try {
      const comment = await Comment.findOneAndUpdate({ _id: id, user: user._id }, { $set: { ...commentUpdate } }, { new: true, lean: true, populate: { path: 'user', select: 'givenName surName displayName' } });

      if (!comment) return errorFormater('comment not found', 404);
      return comment;
    } catch (error) {
      req.logger?.error(`[editComment]: ${error}`);
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = commentMutation;
