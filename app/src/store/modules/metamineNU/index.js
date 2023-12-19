import actions from './actions.js'
import mutations from './mutations.js'

export default {
  namespaced: true,
  state: {
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
    refreshStatus: true
  },
  getters: {
    getFetchedNames: (state) => state.fetchedNames,
    getDatasets: (state) => state.datasets,
    getActiveData: (state) => state.activeData,
    getDataLibrary: (state) => state.dataLibrary,
    getDataPoint: (state) => state.dataPoint,
    getRefreshStatus: (state) => state.refreshStatus
  },
  actions,
  mutations
}
