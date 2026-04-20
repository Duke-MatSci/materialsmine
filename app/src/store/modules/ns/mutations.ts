export default {
  setLoading(state: any, payload: boolean) {
    state.loading = payload;
  },
  setMetrics(state: any, payload: any) {
    state.metrics = payload;
  },
  setDetails(state: any, payload: any) {
    state.details = payload;
  },
  setClasses(state: any, arr: any[]) {
    state.classes = arr;
  },
  setSubmissions(state: any, obj: any) {
    state.submissions = obj;
  },
  setLastUpdade(state: any, obj: any) {
    state.lastUpdated = obj;
  },
  setSelectedId(state: any, id: string) {
    state.selectedId = id;
  },
  setCurrentClass(state: any, payload: any) {
    state.currentClass = payload;
  },
  clearCurrentClass(state: any) {
    state.currentClass = {};
  },
  setSearchResult(state: any, payload: any) {
    if (Array.isArray(payload)) {
      state.queryGroup = payload;
    } else {
      state.currentClass = payload;
    }
  },
  clearSearchQueries(state: any) {
    state.queryGroup = [];
    state.singleQuery = '';
  },
  showErrorResponse(state: any, payload: boolean) {
    state.searchError = payload;
  },
};
