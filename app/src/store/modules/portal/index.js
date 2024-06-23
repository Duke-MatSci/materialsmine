import mutations from './mutations.js';
import actions from './actions.js';
import getters from './getters.js';

export default {
  namespaced: true,
  state() {
    return {
      dockerVersions: [],
      currentVersion: 'latest',
      deploy: null,
      deploymentStatus: null,
      isSuccess: false,
      isError: false,
      isLoading: false,
      loadingMessage: ''
    };
  },
  mutations,
  actions,
  getters
};
