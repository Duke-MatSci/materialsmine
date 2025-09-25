import { getDefaultChart, loadChart } from '@/modules/vega-chart'

export default {
  resetChart ({ dispatch }) {
    dispatch('setChart', getDefaultChart())
  },
  async loadChart ({ dispatch }, uri) {
    const chart = await loadChart(uri)
    dispatch('setChart', chart)
  },
  setChart ({ commit }, chart) {
    commit('setBaseSpec', chart.baseSpec)
    commit('setQuery', chart.query)
    commit('setTitle', chart.title)
    commit('setDescription', chart.description)
    commit('setDepiction', chart.depiction)
    commit('setDownloadUrl', chart.downloadUrl)
    commit('setDataset', chart.dataset)
  }
}
