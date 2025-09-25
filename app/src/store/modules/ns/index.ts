import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export default {
  namespaced: true,
  state(): any {
    return {
      loading: true,
      queryGroup: [],
      singleQuery: '',
      classes: [],
      currentClass: {},
      metrics: {},
      details: {},
      submissions: [],
      selectedId: null,
      searchError: false,
    };
  },
  mutations,
  actions,
  getters,
};
