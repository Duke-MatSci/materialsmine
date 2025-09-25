export default {
  setDatasetList (state, payload) {
    state.items = payload
  },
  setDatasetTotal (state, payload) {
    state.total = payload
  },
  setDatasetPage (state, payload) {
    state.page = payload
  },
  setQueryTimeMillis (state, queryTimeMillis) {
    state.queryTimeMillis = queryTimeMillis
  }
}
