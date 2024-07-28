const express = require('express');
const router = express.Router();
const {
  getKnowledge,
  getFacetValues,
  getAllCharts,
  getAllDatasets,
  getSparql,
  getInstanceFromKnowledgeGraph,
  getDoiInfo,
  searchRor
} = require('../controllers/kgWrapperController');
const isAuth = require('../middlewares/isAuth');
const { getInternal } = require('../middlewares/isInternal');
const { isKnowledgeCached } = require('../middlewares/knowledge-cache');
const { validateFavoriteChart } = require('../middlewares/validations');
const { latencyTimer } = require('../middlewares/latencyTimer');
const {
  addFavoriteChart,
  getFavoriteCharts,
  removeFavoriteChart
} = require('../controllers/favoritesController');

/**
 * Internal KG Wrapper Routes
 */
router.route('/').get(getFacetValues);

/**
 * External API KG Wrapper Routes
 */
router
  .route('/api')
  .all(isAuth)
  .get(getKnowledge)
  .post(isAuth, getKnowledge)
  .put(isAuth, getKnowledge);

router.route('/facets').put(isAuth, getInternal, getKnowledge);

router.route('/charts').get(getAllCharts);

router
  .route('/charts/favorites')
  .all(latencyTimer)
  .post(isAuth, validateFavoriteChart, addFavoriteChart)
  .get(isAuth, getFavoriteCharts)
  .delete(isAuth, removeFavoriteChart);

router.route('/datasets').get(getAllDatasets);

router.route('/images').get(getInstanceFromKnowledgeGraph);

router.route('/instance').get(getInstanceFromKnowledgeGraph);

router
  .route('/sparql')
  .post(isAuth, isKnowledgeCached, getSparql)
  .delete(isAuth, getSparql)
  .get(isKnowledgeCached, getSparql);

router.route('/getdoi/:doi([^/]*)').get(getDoiInfo);

router.route('/ror').get(searchRor);

module.exports = router;
