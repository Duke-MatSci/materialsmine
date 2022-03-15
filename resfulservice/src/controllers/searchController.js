const elasticSearch = require('../utils/elasticSearch');

/**
 * Search and render function
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.explorerSearch = async (req, res, next) => {
  const log = req.logger;
  const request = req?.query;
  try {
    if(!request.search) {
      return res.status(201).json();
    }
    const response = await elasticSearch.search(request.search);
    return res.status(200).json({
      data: response.data
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
