export default {
  setDataPoint (state, payload) {
    state.dataPoint = payload
  },
  setFetchedNames (state, payload) {
    state.fetchedNames = payload
  },
  setDatasets (state, payload) {
    state.datasets = payload
  },
  setActiveData (state, payload) {
    state.activeData = payload
  },
  setDataLibrary (state, payload) {
    state.dataLibrary = payload
  },
  setSelectedData (state, payload) {
    state.selectedData = payload
  },
  setPage (state, payload) {
    state.page = payload
  },
  setQuery1 (state, payload) {
    state.query1 = payload
  },
  setQuery2 (state, payload) {
    state.query2 = payload
  },
  setNeighbors (state, payload) {
    state.neighbors = payload
  },
  setReset (state, payload) {
    state.reset = payload
  },
  setKnnUmap (state, payload) {
    state.knnUmap = payload
  },
  setDialogBoxActiveKnn (state, payload) {
    state.dialogBoxActiveKnn = payload
  },
  updateEnableKnn (state, payload) {
    state.enableKnn = payload
  },
  setRefreshStatus (state, payload) {
    state.refreshStatus = payload
  },
  setLoadingState (state, payload) {
    state.loadingState = payload
  }
}
