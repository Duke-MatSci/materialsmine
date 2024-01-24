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
  setSearching (state, payload) {
    if (payload) {
      state.searching = payload.set
      return
    }

    if (state.searchKeyword && state.searchKeyword.length) {
      state.searching = true
    }
  },
  setEnableAutosuggest (state, payload) {
    state.enableAutosuggest = payload
  },
  setCurrentDataset (state, payload) {
    state.dataset = payload
  },
  setCurrentDatasetThumbnail (state, payload) {
    state.datasetThumbnail = payload
  },
  setDynamfitData (state, payload) {
    state.dynamfitData = payload
  },
  resetDynamfitData (state) {
    state.dynamfitData = {}
  },
  resetDynamfit (state) {
    state.dynamfit = {
      range: 100,
      fitSettings: false,
      model: 'Linear',
      fileUpload: ''
    }
  }
}
