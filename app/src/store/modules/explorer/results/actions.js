import { loadJsonView } from '@/modules/whyis-view'
import articleMetadata from '@/modules/article/articleMetadata'

export default {
  // Placeholder functions for loading individual result types
  // TODO: Replace with real loading functions
  async loadArticles ({ commit, getters }, { page = 1 } = {}) {
    const DOIs = [
      '10.1016/j.carbon.2014.01.031',
      '10.1016/j.polymer.2011.06.018',
      '10.1016/j.polymertesting.2016.12.021',
      '10.1021/acsami.6b06650',
      '10.1109/CEIDP.2006.312055',
      '10.1109/CEIDP.2008.4772808',
      '10.1109/CEIDP.2009.5377878',
      '10.1109/CEIDP.2012.6378717',
      '10.1109/ceidp.2014.6995891',
      '10.1109/ICACACT.2014.7223517'
    ]
    const articles = DOIs.map(doi => articleMetadata.get({ doi }))
    commit('setArticles', articles.map(article => ({
      label: article.title || '',
      description: article.abstract || '',
      identifier: article.url || ''
    })))
  },
  async loadSamples ({ commit, getters }, { page = 1 } = {}) {
    commit('setSamples', [])
  },
  async loadImages ({ commit, getters }, { page = 1 } = {}) {
    commit('setImages', [])
  },
  async loadCharts ({ commit, getters }, { page = 1 } = {}) {
    const allCharts = await loadJsonView({ uri: 'http://semanticscience.org/resource/Chart', view: 'instances' })
    commit('setCharts', allCharts)
  },
  async loadMaterials ({ commit, getters }, { page = 1 } = {}) {
    commit('setMaterials', [])
  }
}
