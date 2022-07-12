import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      // allItems: null,
      items: null,
      pageSize: 50,
      page: 1,
      queryTimeMillis: 0,
      total: 0
    }
  },
  mutations,
  actions,
  getters
}
