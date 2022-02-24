
/**
 * getKnowledge - Retrieves data from the KG
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns {*} response
 */
exports.getKnowledge = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'Fetched graph successfully!',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};