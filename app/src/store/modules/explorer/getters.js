export default {
  menuVisible (state) {
    return state.toggleMenuVisibility
  },
  getResultsTab (state) {
    return state.resultsTab
  },
  getSearchKeyword (state) {
    return state.searchKeyword
  },
  getSearching (state) {
    return state.searching
  },
  getFacetFilterMaterials (state) {
    return state.facetFilterMaterials
  },
  getSelectedFacetFilterMaterials (state) {
    return state.selectedFacetFilterMaterials
  },
  getSelectedFacetFilterMaterialsValue (state) {
    return state.selectedFacetFilterMaterialsValue
  },
  getAutosuggest (state) {
    return state.enableAutosuggest
  },
  getCurrentDataset (state) {
    return state.dataset
  },
  getDatasetThumbnail (state) {
    return state.datasetThumbnail
  },
  getDynamfitData (state) {
    return state.dynamfitData
  },
  getDynamfitDomain (state) {
    return state.dynamfitDomain
  }
}
