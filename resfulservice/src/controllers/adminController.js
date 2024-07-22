const elasticSearch = require('../utils/elasticSearch');
const { outboundRequest } = require('../controllers/kgWrapperController');
const DatasetId = require('../models/datasetId');
const URI = require('../../config/uri');
const DatasetProperty = require('../models/datasetProperty');
const { default: axios } = require('axios');
const { successWriter, errorWriter } = require('../utils/logWriter');
const { validateIsAdmin } = require('../middlewares/validations');
const { setInternal } = require('../middlewares/isInternal');
const latency = require('../middlewares/latencyTimer');
/**
 * Initialize Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.initializeElasticSearch = async (req, res, next) => {
  validateIsAdmin(req, res, next);

  const log = req.logger;
  log.info('initializeElasticSearch(): Function entry');
  try {
    const response = await elasticSearch.initES(req);
    successWriter(req, 'success', 'initializeElasticSearch');
    return res.status(200).json({
      data: response
    });
  } catch (err) {
    next(errorWriter(req, err, 'initializeElasticSearch', 500));
  }
};

/**
 * Redirect admin user to object store
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} redirect
 */
exports.loadObjectStore = async (req, res, next) => {
  const log = req.logger;
  log.info('loadObjectStore(): Function entry');

  return res.redirect(`http://localhost:${req.env.MINIO_CONSOLE_PORT}`);
};

/**
 * Bulk Load Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
const _loadBulkElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('_loadBulkElasticSearch(): Function entry');
  const body = JSON.parse(req?.body);
  const type = body?.type;
  const data = body?.data;

  if (!type || !data.length) {
    return next(
      errorWriter(
        req,
        'Category type or doc array is missing',
        '_loadBulkElasticSearch',
        422
      )
    );
  }

  try {
    const total = data.length ?? 0;
    let rejected = 0;

    // Delete existing docs in this index type
    log.info(`_loadBulkElasticSearch(): Deleting existing ${type} indices`);

    /** Users will always pass limit & offset, if submitting multi bulk entries.
     * If it's missing in request header delete existing docs
     * Only clear if it is a one time bulk entry.
     */
    if ((!req.query.offset || +req.query.offset === 0) && !!total) {
      await elasticSearch.deleteIndexDocs(req, type);
      log.info(
        `_loadBulkElasticSearch(): Successfully deleted ${type} indices`
      );
    } else {
      log.info(`_loadBulkElasticSearch(): Skipped deleting ${type} indexes`);
    }

    for (const item of data) {
      const response = await elasticSearch.indexDocument(req, type, item);

      if (!response) {
        log.debug(
          `_loadBulkElasticSearch()::error: rejected - ${response.statusText}`
        );
        rejected = rejected + 1;
      }
    }

    await elasticSearch.refreshIndices(req, type);
    successWriter(req, 'success', '_loadBulkElasticSearch');

    return res.status(200).json({
      total,
      rejected
    });
  } catch (err) {
    next(errorWriter(req, err, '_loadBulkElasticSearch', 500));
  }
};

/**
 * Insert doc into Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.loadElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('loadElasticSearch(): Function entry');

  const body = req?.body;
  const type = body?.type;
  const doc = body?.doc;

  if (!type || !doc) {
    return next(
      errorWriter(
        req,
        'Category type or doc is missing',
        'loadElasticSearch',
        422
      )
    );
  }

  try {
    let response;
    if (req.method === 'DELETE') {
      validateIsAdmin(req, res, next);

      log.info(`loadElasticSearch(): deleting ${type} matching ${doc}`);
      response = await elasticSearch.deleteSingleDoc(req, type, doc);
      log.info(
        `loadElasticSearch(): successfully deleted ${response.deleted} doc(s)`
      );
    } else {
      response = await elasticSearch.indexDocument(req, type, doc);
      log.info(
        `loadElasticSearch(): successfully added ${JSON.stringify(doc)} doc`
      );
    }

    await elasticSearch.refreshIndices(req, type);
    successWriter(req, 'success', 'loadElasticSearch');

    return res.status(200).json({
      response
    });
  } catch (err) {
    next(errorWriter(req, err, 'loadElasticSearch', 500));
  }
};

/**
 * Ping Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.pingElasticSearch = async (req, res, next) => {
  validateIsAdmin(req, res, next);

  const { logger } = req;
  logger.info('pingElasticSearch(): Function entry');

  try {
    const response = await elasticSearch.ping(logger, 1);
    successWriter(req, 'success', 'pingElasticSearch');
    return res.status(200).json({
      response
    });
  } catch (err) {
    next(errorWriter(req, err, 'pingElasticSearch', 500));
  }
};

/**
 * Fetch data from knowledge graph and dump into ES
 * NOTE: It overwrites the index
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.dataDump = async (req, res, next) => {
  const log = req.logger;
  log.info('dataDump(): Function entry');

  try {
    if (req.method === 'DELETE') {
      const type = req.query.type;
      await elasticSearch.deleteIndexDocs(req, type);
      return res.status(200);
    }

    const { type, data } = await outboundRequest(req, next);
    req.body = JSON.stringify({ type, data });

    return _loadBulkElasticSearch(req, res, next);
  } catch (err) {
    next(errorWriter(req, err, 'dataDump', 500));
  }
};

/** This function allows for upload already fetched data
 * into ES. It will NOT call the knowledge graph as it assumes
 * user already have the data. NOTE: It overwrites the index
 */
exports.bulkElasticSearchImport = (req, res, next) => {
  const log = req.logger;
  log.info('bulkElasticSearchImport(): Function entry');

  return _loadBulkElasticSearch(req, res, next);
};

/**
 * Deletes an index from Elastic Search based on the provided type.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function to call
 * @return {Object} JSON object containing the response
 */
exports.deleteElasticSearchIndex = async (req, res, next) => {
  const log = req.logger;
  log.info('deleteElasticSearchIndex(): Function entry');
  const type = req.params.type;

  validateIsAdmin(req, res, next);

  try {
    await elasticSearch.deleteIndex(req, type);
    successWriter(req, 'success', 'deleteElasticSearchIndex');
    return res.status(200).json({
      message: 'success'
    });
  } catch (error) {
    next(errorWriter(req, error, 'deleteElasticSearchIndex', 500));
  }
};

/**
 * Populate datasetId table with existing data from datasets table
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.populateDatasetIds = async (req, res, next) => {
  const log = req.logger;
  log.info('populateDatasetIds(): Function entry');
  // if (!req.user) {
  //   return next(errorWriter(req, 'User is unauthorized', 'populateDatasetIds', 401));
  // }

  // const connDB = iterator.generateMongoUrl(req);
  // if (!connDB) return next(errorWriter(req, 'DB error', 'populateDatasetIds'));

  try {
    // TODO: Fix iterator or remove
    // const db = await iterator.dbConnectAndOpen(connDB, req?.env?.MM_DB);
    // const Dataset = await db.collection('datasets');
    // const datasets = await Dataset.find({});
    // await iterator.iteration(datasets, async (arg) => {
    //   const user = await User.findOne({ userid: arg?.userid }).lean();
    //   const userExistInDatasetId = await DatasetId.findOne({ user: user._id });
    //   if (userExistInDatasetId?._id) {
    //     userExistInDatasetId.dataset.push(arg);
    //     await userExistInDatasetId.save();
    //     return;
    //   }
    //   const datasetId = new DatasetId({ user });
    //   datasetId.dataset.push(arg._id);
    //   await datasetId.save();
    //   return datasetId;
    // }, 2);
    const user = req.user;
    const datasetId = new DatasetId({ user });
    const createdDataset = await datasetId.save();

    successWriter(
      req,
      { message: `Successfully created DatasetId: ${createdDataset._id}` },
      'populateDatasetIds'
    );
    return res.status(201).json({
      id: createdDataset._id,
      samples: createdDataset.samples,
      status: createdDataset.status,
      creationDate: createdDataset.createdAt
    });
  } catch (err) {
    next(errorWriter(req, err, 'populateDatasetIds', 500));
  }
};

/**
 * Populate dataset properties with existing data from the KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.populateDatasetProperties = async (req, res, next) => {
  const log = req.logger;
  log.info('populateDatasetProperties(): Function entry');
  try {
    const datasetPropertyCount = await DatasetProperty.find().countDocuments();
    if (datasetPropertyCount < 1) {
      let response = await axios({
        method: 'GET',
        url: URI.datasetProperties,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200) {
        response = response.data.results.bindings.map(
          ({ Attribute, Label }) => ({
            attribute: Attribute?.value,
            label: Label?.value
          })
        );
        await DatasetProperty.insertMany(response);
      }
    }
    successWriter(
      req,
      { message: 'Successfully updated dataset properties' },
      'populateDatasetProperties'
    );
    return res
      .status(201)
      .json({ message: 'Successfully updated dataset properties' });
  } catch (err) {
    next(errorWriter(req, err, 'populateDatasetProperties'));
  }
};

/**
 * Retrieve dataset properties KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getDatasetProperties = async (req, res, next) => {
  const log = req.logger;
  log.info('getDatasetProperties(): Function entry');
  try {
    const searchQuery = req.query?.search;
    if (!searchQuery) {
      return next(
        errorWriter(
          req,
          'search query params is missing',
          'getDatasetProperties',
          400
        )
      );
    }
    let filter = {};
    const searchQueryArr = searchQuery.split(' ');
    if (searchQueryArr.length >= 2) {
      filter = {
        $or: [
          {
            label: {
              $regex: new RegExp(`^${searchQuery}|${searchQuery}$`, 'gi')
            }
          },
          {
            label: {
              $regex: new RegExp(
                `^${searchQueryArr[0]}|${searchQueryArr[0]}$`,
                'gi'
              )
            }
          }
        ]
      };
    } else {
      filter = {
        label: { $regex: new RegExp(`^${searchQuery}|${searchQuery}$`, 'gi') }
      };
    }
    const datasetProperties = await DatasetProperty.find(filter).select(
      'attribute label -_id'
    );
    return res.status(200).json({ data: datasetProperties });
  } catch (err) {
    next(errorWriter(req, err, 'getDatasetProperties'));
  }
};

exports.deploymentTags = async (req, res, next) => {
  const log = req.logger;
  log.info('deploymentTags(): Function entry');
  try {
    const url = req.env.DOCKER_HUB_ADDRESS;
    const { data, status } = await makeRequest(req, url, 'deploymentTags');
    if (status !== 200) {
      return res.status(status).json({ message: data });
    }

    const { results } = data;
    const tags = results.map((result) => result.name);
    successWriter(req, JSON.stringify(tags), 'deploymentTags');
    latency.latencyCalculator(res);
    return res.status(status).json(tags);
  } catch (error) {
    next(errorWriter(req, error, 'deploymentTags'));
  }
};

exports.generalDeployment = async (req, res, next) => {
  const log = req.logger;
  log.info('generalDeployment(): Function entry');
  const { version } = req.body;
  try {
    const url = `${req.env.DEPLOYMENT_ADDRESS}/deploy/general/${version}`;
    const result = await makeRequest(req, url, 'generalDeployment');

    successWriter(req, { message: 'success' }, 'generalDeployment');
    latency.latencyCalculator(res);
    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.data });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(errorWriter(req, error, 'generalDeployment'));
  }
};

exports.ontologyDeployment = async (req, res, next) => {
  const log = req.logger;
  log.info('ontologyDeployment(): Function entry');
  const { version } = req.body;
  try {
    const url = `${req.env.DEPLOYMENT_ADDRESS}/deploy/ontology/${version}`;
    const result = await makeRequest(req, url, 'ontologyDeployment');

    successWriter(req, { message: 'success' }, 'ontologyDeployment');
    latency.latencyCalculator(res);
    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.data });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(errorWriter(req, error, 'ontologyDeployment'));
  }
};

exports.deploymentStatus = async (req, res, next) => {
  const log = req.logger;
  const { deploymentType } = req.params;
  log.info('deploymentStatus(): Function entry');
  try {
    const url = `${req.env.DEPLOYMENT_ADDRESS}/deploy/status/${deploymentType}`;
    const result = await makeRequest(req, url, 'deploymentStatus');

    successWriter(req, { message: 'success' }, 'deploymentStatus');
    latency.latencyCalculator(res);
    if (result.status !== 200) {
      return res.status(result.status).json({ message: result.data });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(errorWriter(req, error, 'deploymentStatus'));
  }
};

const makeRequest = async (req, url, caller) => {
  const { logger: log, method } = req;
  log.info('makeRequest(): Function entry');

  const token = setInternal(req, { apiKey: req.env.DEPLOYMENT_SECRET });
  const headers =
    caller === 'deploymentTags'
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        };
  try {
    const response = await axios.request({
      method,
      url,
      headers
    });

    return {
      status: response.status,
      data: response.data
    };
  } catch (error) {
    errorWriter(req, error, caller, 500);
    if (error.response) {
      return {
        status: 500,
        data: 'Cannot not process this request at this time'
      };
    } else if (error.request) {
      return {
        status: 500,
        data: 'No response received from the server'
      };
    } else {
      throw error;
    }
  }
};
