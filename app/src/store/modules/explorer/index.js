import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

import gallery from './gallery'
import results from './results'

export default {
  namespaced: true,
  modules: {
    gallery,
    results
  },
  state () {
    return {
      toggleMenuVisibility: false,
      resultsTab: '',
      searchKeyword: '',
      searching: false
    }
  },
  mutations,
  actions,
  getters
}
