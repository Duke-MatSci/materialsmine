const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');

router.route('')
//   .get(getInternal, SearchController.explorerSearch) //TODO
  .get(SearchController.explorerSearch);
router.route('/autosuggest')
//   .get(getInternal, SearchController.explorerSearch) //TODO
  .get(SearchController.autoSuggestSearch);

module.exports = router;
