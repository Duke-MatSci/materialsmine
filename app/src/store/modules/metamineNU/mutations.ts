export default {
  setDataPoint(state: any, payload: any) {
    state.dataPoint = payload;
  },
  setFetchedNames(state: any, payload: any) {
    state.fetchedNames = payload;
  },
  setDatasets(state: any, payload: any) {
    state.datasets = payload;
  },
  setActiveData(state: any, payload: any) {
    state.activeData = payload;
  },
  setDataLibrary(state: any, payload: any) {
    state.dataLibrary = payload;
  },
  setSelectedData(state: any, payload: any) {
    state.selectedData = payload;
  },
  setPage(state: any, payload: any) {
    state.page = payload;
  },
  setQuery1(state: any, payload: any) {
    state.query1 = payload;
  },
  setQuery2(state: any, payload: any) {
    state.query2 = payload;
  },
  setNeighbors(state: any, payload: any) {
    state.neighbors = payload;
  },
  setReset(state: any, payload: any) {
    state.reset = payload;
  },
  setKnnUmap(state: any, payload: any) {
    state.knnUmap = payload;
  },
  setDialogBoxActiveKnn(state: any, payload: any) {
    state.dialogBoxActiveKnn = payload;
  },
  updateEnableKnn(state: any, payload: any) {
    state.enableKnn = payload;
  },
  setRefreshStatus(state: any, payload: any) {
    state.refreshStatus = payload;
  },
  setLoadingState(state: any, payload: any) {
    state.loadingState = payload;
  },
  setRawJsonFile(state: any, payload: any) {
    state.rawJson = payload;
  },
};
