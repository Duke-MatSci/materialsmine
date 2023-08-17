import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

import gallery from './gallery'
import results from './results'
import curation from './curation'

export default {
  namespaced: true,
  modules: {
    gallery,
    results,
    curation
  },
  state () {
    return {
      toggleMenuVisibility: false,
      enableAutosuggest: true,
      resultsTab: 'getArticles',
      searchKeyword: '',
      searching: false,
      facetFilterMaterials: [],
      selectedFacetFilterMaterialsValue: null,
      selectedFacetFilterMaterials: {},
      dataset: null,
      datasetThumbnail: ''
    }
  },
  mutations,
  actions,
  getters
}
