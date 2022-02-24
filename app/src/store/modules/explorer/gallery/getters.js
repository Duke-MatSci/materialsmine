export default {
  allItems (state) {
    return state.allItems
  },
  items (state) {
    return state.items
  },
  pageSize (state) {
    return state.pageSize
  },
  page (state) {
    return state.page
  },
  total (state, getters) {
    return (getters.allItems || []).length
  },
  totalPages (state, getters) {
    return Math.ceil(getters.total / getters.pageSize)
  },
  queryTimeMillis(state) {
    return state.queryTimeMillis
  }
}
