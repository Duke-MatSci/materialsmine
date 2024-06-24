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
  total (state) {
    return state.total || 0
  },
  totalPages (state, getters) {
    return Math.ceil(getters.total / getters.pageSize)
  },
  queryTimeMillis (state) {
    return state.queryTimeMillis
  },
  favoriteChartItems (state) {
    return state.favoriteChartItems
  },
  totalFavorites (state) {
    return state.totalFavorites || 0
  },
  missingCharts (state) {
    return state.missingCharts
  }
}
