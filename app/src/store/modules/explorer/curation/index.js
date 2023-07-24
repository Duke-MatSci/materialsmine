import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      datasetId: null,
      fieldNameSelected: '',
      newChartExist: false,
      doiData: null,
      orcidData: null,
      xmlBulkResponse: null
    }
  },
  mutations,
  actions,
  getters
}
