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
    knnUmap: 15
  },
  getters: {
    getFetchedNames: state => state.fetchedNames,
    getDatasets: state => state.datasets,
    getActiveData: state => state.activeData,
    getDataLibrary: state => state.dataLibrary,
    getDataPoint: state => state.dataPoint
  },
  actions: {
    setDataPoint (context, payload) {
      context.commit('setDataPoint', payload)
    },
    setFetchedNames (context, payload) {
      context.commit('setFetchedNames', payload)
    },
    setDatasets (context, payload) {
      context.commit('setDatasets', payload)
    },
    setActiveData (context, payload) {
      context.commit('setActiveData', payload)
    },
    setDataLibrary (context, payload) {
      context.commit('setDataLibrary', payload)
    },
    setSelectedData (context, payload) {
      context.commit('setSelectedData', payload)
    },
    setPage (context, payload) {
      context.commit('setPage', payload)
    },
    setQuery1 (context, payload) {
      context.commit('setQuery1', payload)
    },
    setQuery2 (context, payload) {
      context.commit('setQuery2', payload)
    },
    setNeighbors (context, payload) {
      context.commit('setNeighbors', payload)
    },
    setReset (context, payload) {
      context.commit('setReset', payload)
    },
    setKnnUmap (context, payload) {
      context.commit('setKnnUmap', payload)
    }

  },
  mutations: {
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
    }
  }
}
