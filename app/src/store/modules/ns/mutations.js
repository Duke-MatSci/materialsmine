export default {
  setLoading (state, payload) {
    state.loading = payload
  },
  setMetrics (state, payload) {
    state.metrics = payload
  },
  setDetails (state, payload) {
    state.details = payload
  },
  setClasses (state, arr) {
    state.classes = arr
  },
  setSubmissions (state, obj) {
    state.submissions = obj
  },
  setLastUpdade (state, obj) {
    state.lastUpdated = obj
  },
  setSelectedId (state, id) {
    state.selectedId = id
  },
  setCurrentClass (state, payload) {
    state.currentClass = payload
  },
  clearCurrentClass (state) {
    state.currentClass = {}
  },
  setSearchResult (state, payload) {
    if (Array.isArray(payload)) {
      state.queryGroup = payload
    } else {
      state.currentClass = payload
    }
  },
  clearSearchQueries (state) {
    state.queryGroup = []
    state.singleQuery = ''
  },
  showErrorResponse (state, payload) {
    state.searchError = payload
  }
}
