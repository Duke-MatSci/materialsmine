export default {
  getFetchedNames: (state: any) => state.fetchedNames,
  getDatasets: (state: any) => state.datasets,
  getActiveData: (state: any) => state.activeData,
  getDataLibrary: (state: any) => state.dataLibrary,
  getDataPoint: (state: any) => state.dataPoint,
  getRefreshStatus: (state: any) => state.refreshStatus,
  getLoadingState: (state: any) => state.loadingState,
  getRawJson: (state: any) => state.rawJson,
};
