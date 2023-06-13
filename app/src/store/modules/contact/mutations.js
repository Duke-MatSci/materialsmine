export default {
  setIsLoading (state, payload) {
    state.isLoading = payload
  },
  setContentEditable (state, payload) {
    state.contentEditable = payload
  },
  setResolved (state, payload) {
    state.showResolved = payload
  },
  setPageNumber (state, payload) {
    state.pageNumber = payload
  },
  setTotalPages (state, payload) {
    state.totalPages = payload
  },
  setContactInquiries (state, payload) {
    state.contactInquiries = [...payload]
  },
  setDisplayedInquiry (state, payload) {
    state.displayedInquiry = payload
  },
  setId (state, payload) {
    state.reply._id = payload
  },
  setMessage (state, payload) {
    state.reply.message = payload
  }
}