import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'
import { getDefaultChart } from '@/modules/vega-chart.js'

export default {
  namespaced: true,
  state () {
    return {
      ...getDefaultChart()
    }
  },
  mutations,
  actions,
  getters
}
