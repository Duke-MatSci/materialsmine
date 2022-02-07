export default {
  setMenuVisible (state) {
    state.toggleMenuVisibility = !state.toggleMenuVisibility
  },
  setSearchKeyword (state, payload) {
    state.searchKeyword = payload
  },
  setSearching (state) {
    if (state?.searchKeyword?.length) {
      state.searching = true
    } else {
      state.searching = false
    }
  }
}
