import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

import gallery from './gallery'

export default {
  namespaced: true,
  modules: {
    gallery
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
