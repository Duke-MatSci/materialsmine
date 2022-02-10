import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      items: null,
      pageSize: 50,
      page: 1,
      total: null
    }
  },
  mutations,
  actions,
  getters
}
