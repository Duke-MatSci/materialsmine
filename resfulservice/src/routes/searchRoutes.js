const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');

router.route('')
//   .get(getInternal, SearchController.explorerSearch)
  .get(SearchController.explorerSearch);
router.route('/autosuggest')
//   .get(getInternal, SearchController.explorerSearch)
  .get(SearchController.autoSuggestSearch);

module.exports = router;
