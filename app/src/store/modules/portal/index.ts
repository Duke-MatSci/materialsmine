import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export interface PortalState {
  dockerVersions: string[];
  currentVersion: string;
  deploy: any;
  deploymentStatus: any;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  loadingMessage: string;
  xsd: any;
}

export default {
  namespaced: true,
  state(): PortalState {
    return {
      dockerVersions: [],
      currentVersion: 'latest',
      deploy: null,
      deploymentStatus: null,
      isSuccess: false,
      isError: false,
      isLoading: false,
      loadingMessage: '',
      xsd: null,
    };
  },
  mutations,
  actions,
  getters,
};
