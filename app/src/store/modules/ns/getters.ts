export default {
  isLoading(state: any) {
    return state.loading;
  },
  getDetails(state: any) {
    return state.details;
  },
  getMetrics(state: any) {
    return state.metrics;
  },
  getClasses(state: any) {
    return state.classes;
  },
  getSelectedId(state: any) {
    return state.selectedId;
  },
  getCurrentClass(state: any) {
    return state.currentClass;
  },
  getSearchResults(state: any) {
    return state.queryGroup;
  },
  getLastUpdatedDate(state: any) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' } as any;
    const date = state.submissions[0]?.uploaded;
    if (date) {
      return new Date(date).toLocaleDateString(undefined, options);
    }
    return '-- -- --';
  },
  getSubmissions(state: any) {
    return state.submissions;
  },
  checkError(state: any) {
    return state.searchError;
  },
};
