const express = require('express');
const router = express.Router();
const { getKnowledge, getFacetValues, getAllCharts, getSparql } = require('../controllers/kgWrapperController');
const isAuth = require('../middlewares/isAuth');
const { getInternal } = require('../middlewares/isInternal');

/**
 * Internal KG Wrapper Routes
 */
router.route('/')
  .get(getFacetValues);

/**
 * External API KG Wrapper Routes
 */
router.route('/api')
  .all(isAuth)
  .get(getKnowledge)
  .post(isAuth, getKnowledge)
  .put(isAuth, getKnowledge);

router.route('/facets')
  .put(isAuth, getInternal, getKnowledge);

router.route('/charts')
  .get(getAllCharts);

router.route('/sparql')
  .post(getSparql);

module.exports = router;
