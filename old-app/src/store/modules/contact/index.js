import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      isLoading: false,
      reply: {
        _id: null,
        message: null
      },
      contentEditable: true,
      pageNumber: 1,
      totalPages: 1,
      pageSize: 10,
      showResolved: false,
      contactInquiries: [],
      displayedInquiry: null
    }
  },
  mutations,
  actions,
  getters
}
