import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export default {
  namespaced: true,
  state(): any {
    return {
      userId: null,
      token: null,
      displayName: null,
      isAdmin: false,
      didAutoLogout: false,
      user: {},
      lastPageVisited: '/nm',
    };
  },
  mutations,
  actions,
  getters,
};
