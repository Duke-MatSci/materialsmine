import { loadJsonView } from '@/modules/whyis-view'

export default {
  //Placeholder functions for loading individual result types
  //TODO: Replace with real loading functions
  async loadArticles({ commit, getters }, { page = 1 } = {}) {
    commit('setArticles', [])
  },
  async loadSamples({ commit, getters }, { page = 1 } = {}) {
    commit('setSamples', [])
  },
  async loadImages({ commit, getters }, { page = 1 } = {}) {
    commit('setImages', [])
  },
  async loadCharts({ commit, getters }, { page = 1 } = {}) {
    const allCharts = await loadJsonView({ uri: 'http://semanticscience.org/resource/Chart', view: 'instances' })
    commit('setCharts', allCharts)
  },
  async loadMaterials({ commit, getters }, { page = 1 } = {}) {
    commit('setMaterials', [])
  },
}
