import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      //TODO:
      articles: null,
      samples: null,
      images: null,
      charts: null,
      materials: null
    }
  },
  mutations,
  actions,
  getters
}
