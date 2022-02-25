export default {
  menuVisible (state) {
    return state.toggleMenuVisibility
  },
  getResultsTab (state) {
    return state.resultsTab
  },
  getSearchKeyword (state) {
    return state.searchKeyword
  },
  getSearching (state) {
    return state.searching
  }
}
