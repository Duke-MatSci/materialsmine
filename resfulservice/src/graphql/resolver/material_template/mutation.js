const MaterialTemplate = require('../../../models/xlsxCurationList');
const errorFormater = require('../../../utils/errorFormater');

const materialMutation = {
  createXlsxCurationList: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger?.info('[createMaterialColumn] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[createMaterialColumn]: User not authenticated to create Material column');
      return errorFormater('not authenticated', 401);
    }
    const { columns } = input;
    const curatedList = columns.map(column => ({ ...column, user: user._id }));
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
      const column = await MaterialTemplate.findOneAndUpdate({ field }, { $set: { ...input, user: user._id } }, { new: true, lean: true, populate: { path: 'user', select: 'displayName' } });
      if (!column) return errorFormater('column not found', 404);
      req.logger?.info(`[updateMaterialColumn]: column successfully updated: ${column.field}`);
      return { ...column, user: column.user.displayName };
    } catch (error) {
      req.logger?.error(`[updateMaterialColumn]: ${error}`);
      return errorFormater(error.message, 500);
    }
  },

  deleteXlsxCurationList: async (_, { input }, { user, req, isAuthenticated }) => {
    req.logger.info('[deleteMaterialColumn] Function Entry:');
    if (!isAuthenticated) {
      req.logger?.error('[deleteMaterialColumn]: User not authenticated to remove listing');
      return errorFormater('not authenticated', 401);
    }
    const { field } = input;
    try {
      const column = await MaterialTemplate.findOneAndDelete({ field }).lean();
      if (!column) return errorFormater('column not found', 404);
      req.logger?.info(`[deleteMaterialColumn]: column successfully deleted: ${column.field}`);
      return column;
    } catch (error) {
      req.logger?.error(`[deleteMaterialColumn]: ${error}`);
      return errorFormater(error, 500);
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
