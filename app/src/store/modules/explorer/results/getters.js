export default {
  // TODO:
  getArticles (state) {
    return state.articles
  },
  getSamples (state) {
    return state.samples
  },
  getImages (state) {
    return state.images
  },
  getCharts (state) {
    return state.charts
  },
  getMaterials (state) {
    return state.materials
  },
  getSuggestions (state) {
    return state.suggestions;
  },
  getTotal (state) {
    return state.total;
  },
  getIsloading (state) {
    return state.isLoading;
  },
  getTotalGroupings (state) {
    return state.totalGrouping
  }
}
