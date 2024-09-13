const { SEARCH_FIELD } = require('../../config/constant');
const Task = require('../sw/models/task');
const elasticSearch = require('../utils/elasticSearch');

/**
 * Check if the knowledge is cached and return the cached result if available. If the knowledge is not cached, call the next middleware.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @return {Object} - The response object with the cached knowledge or a new nightly run task
 */
exports.isKnowledgeCached = async (req, res, next) => {
  const query = req.query.query ?? req.body?.query;
  // 1. NOT caching curation submissions
  if (req.query.whyisPath === 'pub') return next();

  // 2. NOT Caching for nanopub listing. Usually this is used for deleting nanopublications
  if (req.query.whyisPath?.includes('about?view=nanopublications&uri=')) {
    return next();
  }

  // 3. NOT Caching empty query strings
  if (!query) return next();

  req.logger.info(':::middleware.isKnowledgeCached Function Entry');

  let kgResponse = {};
  let knowledgeId = null;
  try {
    // TODO: (Redo) There is an existing search implementation in ES. This new one is not required
    const cacheResult = await elasticSearch.searchType(
      req,
      query,
      SEARCH_FIELD.label,
      'knowledge'
    );

    if (cacheResult.data.hits.hits.length) {
      const {
        _id,
        _source: { response, date }
      } = cacheResult.data.hits.hits[0];
      kgResponse = response;
      knowledgeId = _id;

      // Get today's date in string format (YYYY-MM-DD);
      const todayDate = new Date().toISOString().slice(0, 10);

      // check if date is today's date
      if (date === todayDate) {
        return res.status(200).json(response);
      }

      // check if Task with same elasticsearch _id has already been created
      const task = await Task.findOne({ 'info.knowledgeId': _id });
      if (task) {
        return res.status(200).json(response);
      }
    }
  } catch (error) {
    return next();
  }

  // Mongo DB insert failure at this point doesn't matter and can be skipped
  // create a nightly run task that runs at midnight
  if (knowledgeId) {
    Task.create({
      serviceName: 'knowledgeRequest',
      whenToRun: 'Nightly',
      info: {
        knowledgeId,
        req: {
          query: { query }
        }
      }
    });
    req.logger.info(
      `Middleware.isKnowledgeCached - Created a new nightly task with id: ${knowledgeId}`
    );
    return res.status(200).json(kgResponse);
  }
  return next();
};

exports.cacheKnowledge = async (req, _res, _next, data) => {
  req.logger.info('cacheKnowledge Function Entry');
  const query = req.query.query ?? req.body?.query;
  // 1. NOT caching curation submissions
  if (req.query.whyisPath === 'pub') return;

  // 2. NOT Caching for nanopub listing. Usually this is used for deleting nanopublications
  if (req.query.whyisPath?.includes('about?view=nanopublications&uri=')) return;

  // 3. NOT Caching empty query strings
  if (!query) return;

  // 4. Cache, and if caching fails its okay to return null and try again next time
  // Caching may fail if Elastic search is unavailable/unreacheable
  try {
    if (req.isBackendCall) {
      const response = await elasticSearch.searchType(
        req,
        query,
        'label',
        'knowledge'
      );
      if (response.data.hits.hits.length) {
        const result = await elasticSearch.deleteSingleDoc(
          req,
          'knowledge',
          response.data.hits.hits[0]._id
        );
        req.logger.info(
          `Middleware.cacheKnowledge - Deleted document: ${result.deleted}`
        );
      }
    }

    const cacheItem = {
      label: query,
      response: data,
      date: new Date().toISOString().slice(0, 10)
    };
    return await elasticSearch.indexDocument(req, 'knowledge', cacheItem);
  } catch (_error) {
    return null;
  }
};
