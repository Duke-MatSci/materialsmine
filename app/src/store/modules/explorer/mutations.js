export default {
  setMenuVisible (state) {
    state.toggleMenuVisibility = !state.toggleMenuVisibility
  },
  setResultsTab (state, payload) {
    state.resultsTab = payload
  },
  setSearchKeyword (state, payload) {
    state.searchKeyword = payload
  },
  setFacetFilterMaterials (state, payload) {
    state.facetFilterMaterials = payload
  },
  setSelectedFacetFilterMaterials (state, payload) {
    state.selectedFacetFilterMaterials = payload
  },
  setSelectedFacetFilterMaterialsValue (state, payload) {
    state.selectedFacetFilterMaterialsValue = payload
  },
  setSearching (state) {
    if (state?.searchKeyword?.length) {
      state.searching = true
    } else {
      state.searching = false
    }
  }
}
