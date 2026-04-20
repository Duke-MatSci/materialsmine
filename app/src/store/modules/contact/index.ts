import mutations from './mutations'
import actions from './actions'
import getters from './getters'

export default {
  namespaced: true,
  state (): any {
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
