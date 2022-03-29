export default {
  // TODO:
  setArticles (state, articles) {
    state.articles = articles
  },
  setSamples (state, samples) {
    state.samples = samples
  },
  setImages (state, images) {
    state.images = images
  },
  setCharts (state, charts) {
    state.charts = charts
  },
  setMaterials (state, materials) {
    state.materials = materials
  },
  setTotal (state, payload) {
    state.total = payload;
  },
  setAutosuggest (state, payload) {
    state.suggestions = payload;
  },
  setIsLoading (state, payload) {
    state.isLoading = payload
  },
  setTotalGrouping (state, payload) {
    state.totalGrouping = payload
  }
}
