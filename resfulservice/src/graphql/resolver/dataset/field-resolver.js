const Dataset = require('../../../models/dataset');
const errorFormater = require('../../../utils/errorFormater');

exports.filesets = async (parent) => {
  try {
    const filesets = await Dataset.findOne({
      userid: parent.user._id,
      datasetId: parent._id
    }).lean();
    return filesets;
  } catch (error) {
    return errorFormater(error.message, 500);
  }
};

exports.files = (parent) => {
  return parent.files.map(({ metadata: { filename } }) => filename);
};
