import actions from './actions';
import mutations, { MetamineNUState } from './mutations';

export default {
  namespaced: true,
  state(): MetamineNUState {
    return {
      fetchedNames: [],
      datasets: [],
      activeData: [],
      dataLibrary: [],
      dataPoint: {},
      selectedData: [],
      page: 'pairwise',
      query1: null,
      query2: null,
      neighbors: [],
      reset: false,
      knnUmap: 15,
      dialogBoxActiveKnn: false,
      enableKnn: true,
      refreshStatus: true,
      loadingState: true,
      rawJson: null,
    };
  },
  getters: {
    getFetchedNames: (state: MetamineNUState) => state.fetchedNames,
    getDatasets: (state: MetamineNUState) => state.datasets,
    getActiveData: (state: MetamineNUState) => state.activeData,
    getDataLibrary: (state: MetamineNUState) => state.dataLibrary,
    getDataPoint: (state: MetamineNUState) => state.dataPoint,
    getRefreshStatus: (state: MetamineNUState) => state.refreshStatus,
    getLoadingState: (state: MetamineNUState) => state.loadingState,
    getRawJson: (state: MetamineNUState) => state.rawJson,
  },
  actions,
  mutations,
};
