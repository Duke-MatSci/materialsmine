import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      loading: true,
      queryGroup: [],
      singleQuery: '',
      classes: [],
      currentClass: {},
      metrics: {},
      details: {},
      submissions: [],
      selectedId: null,
      searchError: false
    }
  },
  mutations,
  actions,
  getters
}
