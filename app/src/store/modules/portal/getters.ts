import { PortalState } from './index';

export default {
  dockerVersions(state: PortalState) {
    return state.dockerVersions;
  },
  currentVersion(state: PortalState) {
    return state.currentVersion;
  },
  isSuccess(state: PortalState) {
    return state.isSuccess;
  },
  isError(state: PortalState) {
    return state.isError;
  },
  isLoading(state: PortalState) {
    return state.isLoading;
  },
  deploy(state: PortalState) {
    return state.deploy;
  },
  deploymentStatus(state: PortalState) {
    return state.deploymentStatus;
  },
  loadingMessage(state: PortalState) {
    return state.loadingMessage;
  },
  xsd(state: PortalState) {
    return state.xsd;
  },
};
