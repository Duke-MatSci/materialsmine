export default {
  isLoading(state) {
    return state.loading;
  },
  getDetails(state) {
    return state.details;
  },
  getMetrics(state) {
    return state.metrics;
  },
  getClasses(state) {
    return state.classes;
  },
  getSelectedId(state) {
    return state.selectedId;
  },
  getCurrentClass(state) {
    return state.currentClass;
  },
  getSearchResults(state) {
    return state.queryGroup;
  },
  getLastUpdatedDate(state) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = state.submissions[0]?.uploaded;
    if (date) {
      return new Date(date).toLocaleDateString(undefined, options);
    }
    return '-- -- --';
  },
  getSubmissions(state) {
    return state.submissions;
  },
  checkError(state) {
    return state.searchError;
  }
};
