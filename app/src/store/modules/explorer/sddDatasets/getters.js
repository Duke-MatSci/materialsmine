export default {
  getAllDatasets (state) {
    return state.items
  },
  getTotal (state) {
    return state.total || 0
  },
  getTotalPages (state, getters) {
    return Math.ceil(getters.getTotal / getters.getPageSize)
  },
  getPage (state) {
    return state.page
  },
  getPageSize (state) {
    return state.pageSize
  },
  getQueryTimeMillis (state) {
    return state.queryTimeMillis
  }
}
