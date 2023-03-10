const MaterialTemplate = require('../../../models/xlsxCurationList');
const errorFormater = require('../../../utils/errorFormater');

const materialMutation = {
  createXlsxCurationList: async (_, { input }, { user, req, isAuthenticated }) => {
    console.log('entered function');
    req.logger?.info('[createMaterialColumn] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[createMaterialColumn]: User not authenticated to create Material column');
      return errorFormater('not authenticated', 401);
    }
    const { columns } = input;
    const curatedList = columns.map(column => ({ ...column, user: user._id }));
    console.log('columns:', columns);
    console.log('curatedList:', curatedList);
    const result = await insertMany(curatedList);
    if (result) return errorFormater(result, 409);
    return { columns: curatedList };
  },

  updateXlsxCurationList: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[updateMaterialColumn] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[updateMaterialColumn]: User not authenticated to view contact listing');
      return errorFormater('not authenticated', 401);
    }
    const { field } = input;
    try {
      const columnExists = await MaterialTemplate.findOne({ field });
      if (!columnExists) return errorFormater('column not found', 404);
      const column = await MaterialTemplate.findOneAndUpdate({ field }, { $set: { ...input, user: user._id } }, { new: true, lean: true, populate: { path: 'user', select: 'displayName' } });
      return { ...column, user: column.user.displayName };
    } catch (error) {
      return errorFormater(error.message, 500);
    }
  }
};

async function insertMany (columns) {
  try {
    await MaterialTemplate.insertMany(columns, { ordered: false, rawResult: true, lean: true });
  } catch (e) {
    return e.writeErrors.map(({ err: { errmsg } }) => errmsg.split('key:')[1]);
  }
};

module.exports = materialMutation;
