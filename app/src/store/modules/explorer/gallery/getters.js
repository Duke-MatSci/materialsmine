export default {
  items (state) {
    return state.items
  },
  pageSize (state) {
    return state.pageSize
  },
  page (state) {
    return state.page
  },
  total (state) {
    return state.total
  },
  totalPages (state, getters) {
    return Math.ceil(getters.total / getters.pageSize)
  }
}
