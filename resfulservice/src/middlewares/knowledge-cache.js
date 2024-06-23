const Task = require('../sw/models/task');
const elasticSearch = require('../utils/elasticSearch');
const { v4: uuidv4 } = require('uuid');

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
  if (req.query.whyisPath?.includes('about?view=nanopublications&uri='))
    return next();

  // 3. NOT Caching empty query strings
  if (!query) return next();

  req.logger.info(':::middleware.isKnowledgeCached Function Entry');

  // TODO: (Redo) There is an existing search implementation in ES. This new one is not required
  const cacheResult = await elasticSearch.searchKnowledgeGraph(req, query);
  if (cacheResult.length) {
    const {
      _id,
      _source: { response, date }
    } = cacheResult[0];

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

    // create a nightly run task that runs at midnight
    Task.create({
      serviceName: 'knowledgeRequest',
      whenToRun: 'Nightly',
      info: {
        knowledgeId: _id,
        req: {
          query: { query }
        }
      }
    });
    req.logger.info(
      `Middleware.isKnowledgeCached - Created a new nightly task with id: ${_id}`
    );
    return res.status(200).json(response);
  }
  next();
};

exports.cacheKnowledge = async (req, res, next, data) => {
  const query = req.query.query ?? req.body?.query;
  // 1. NOT caching curation submissions
  if (req.query.whyisPath === 'pub') return;

  // 2. NOT Caching for nanopub listing. Usually this is used for deleting nanopublications
  if (req.query.whyisPath?.includes('about?view=nanopublications&uri=')) return;

  // 3. NOT Caching empty query strings
  if (!query) return;

  const cacheItem = {
    label: query,
    response: data,
    date: new Date().toISOString().slice(0, 10)
  };
  return await elasticSearch.indexDocument(req, 'knowledge', cacheItem);
};
