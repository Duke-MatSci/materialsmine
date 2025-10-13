export default {
  setIsLoading (state: any, payload: boolean) {
    state.isLoading = payload
  },
  setContentEditable (state: any, payload: boolean) {
    state.contentEditable = payload
  },
  setResolved (state: any, payload: boolean) {
    state.showResolved = payload
  },
  setPageNumber (state: any, payload: number) {
    state.pageNumber = payload
  },
  setTotalPages (state: any, payload: number) {
    state.totalPages = payload
  },
  setContactInquiries (state: any, payload: any[]) {
    state.contactInquiries = [...payload]
  },
  setDisplayedInquiry (state: any, payload: any) {
    state.displayedInquiry = payload
  },
  setId (state: any, payload: string | null) {
    state.reply._id = payload
  },
  setMessage (state: any, payload: string | null) {
    state.reply.message = payload
  }
}
