const Comment = require('../../../models/comment');
const errorFormater = require('../../../utils/errorFormater');
const paginator = require('../../../utils/paginator');

const commentsQuery = {
  loadComment: async (_, { input }, { req }) => {
    req.logger?.info('[loadComment] Function Entry');

    try {
      const { pageNumber, pageSize, ...filter } = input;
      const pagination = paginator(await Comment.countDocuments(filter), input?.pageNumber, input?.pageSize);

      const comments = await Comment
        .find(input, { comment: 1, user: 1, createdAt: 1, updatedAt: 1 }, { lean: true, populate: { path: 'user', select: 'givenName surName displayName' } })
        .limit(pagination.pageSize)
        .skip(pagination.skip);

      return Object.assign(pagination, { comments });
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

module.exports = commentsQuery;
