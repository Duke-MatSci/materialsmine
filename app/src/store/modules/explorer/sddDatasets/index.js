import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      queryTimeMillis: 0
    }
  },
  mutations,
  actions,
  getters
}
