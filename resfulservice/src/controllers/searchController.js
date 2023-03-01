const elasticSearch = require('../utils/elasticSearch');
const { successWriter, errorWriter } = require('../utils/logWriter');

/**
 * Search and render function
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.explorerSearch = async (req, res, next) => {
  // const log = req.logger;
  const request = req?.query;
  try {
    if (!request.search) {
      successWriter(req, 'success', 'explorerSearch');
      return res.status(201).json();
    }
    const response = await elasticSearch.search(request.search);
    successWriter(req, 'success', 'explorerSearch');
    return res.status(200).json({
      data: response.data?.hits
    });
  } catch (err) {
    next(errorWriter(req, err, 'explorerSearch', 500));
  }
};

/**
 * Search and render function
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.autoSuggestSearch = async (req, res, next) => {
  // const log = req.logger;
  const request = req?.query;
  try {
    if (!request.search) {
      successWriter(req, 'success', 'autoSuggestSearch');
      return res.status(201).json();
    }
    const response = await elasticSearch.search(request.search, true);
    successWriter(req, 'success', 'autoSuggestSearch');
    return res.status(200).json({
      data: response.data?.hits
    });
  } catch (err) {
    next(errorWriter(req, err, 'autoSuggestSearch', 500));
  }
};
