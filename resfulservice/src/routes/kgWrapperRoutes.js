const express = require('express');
const router = express.Router();
const { getKnowledge, getFacetValues } = require('../controllers/kgWrapperController');
const isAuth = require('../middlewares/isAuth');
const { getInternal } = require('../middlewares/isInternal');
/**
 * Internal KG Wrapper Routes
 */
router.route('/')
  .get(getFacetValues);
// .get(getInternal, getFacetValues)

router.route('/facets')
  .put(isAuth, getInternal, getKnowledge);

/**
 * External API KG Wrapper Routes
 */
router.route('/api')
  .all(isAuth)
  .get(getKnowledge)
  .post(isAuth, getKnowledge)
  .put(isAuth, getKnowledge);

module.exports = router;
