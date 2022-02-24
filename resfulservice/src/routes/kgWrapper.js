const express = require('express');
const router = express.Router();
const { getKnowledge } = require('../controllers/kgWrapper');
const isAuth = require('../middlewares/isAuth');
const { getInternal } = require('../middlewares/isInternal');
/**
 * Internal KG Wrapper Routes
 */
router.route('/internal')
.get(getInternal, getKnowledge)
.put(isAuth, getInternal, getKnowledge)
.post(isAuth, getInternal, getKnowledge)
.delete(isAuth, getInternal, getKnowledge);

/**
 * External API KG Wrapper Routes
 */
router.route('/api')
.all(isAuth)
.get(getKnowledge)
.post(isAuth, getKnowledge)
.put(isAuth, getKnowledge);


module.exports = router;