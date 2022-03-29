import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      // TODO:
      articles: null,
      samples: null,
      images: null,
      charts: null,
      materials: null,
      suggestions: [],
      total: 0,
      isLoading: false,
      totalGrouping: {
        getArticles: 0,
        getSamples: 0,
        getImages: 0,
        getCharts: 0,
        getMaterials: 0
      }
    }
  },
  mutations,
  actions,
  getters
}
