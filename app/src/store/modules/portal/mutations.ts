import { PortalState } from './index';

export default {
  setDockerVersions(state: PortalState, payload: string[]) {
    state.dockerVersions = payload;
  },
  setCurrentVersion(state: PortalState, payload: string) {
    state.currentVersion = payload;
  },
  setSuccess(state: PortalState, payload: boolean) {
    state.isSuccess = payload;
  },
  setError(state: PortalState, payload: boolean) {
    state.isError = payload;
  },
  setLoading(state: PortalState) {
    state.isLoading = !state.isLoading;
  },
  setLoadingMessage(state: PortalState, { message }: { message: string }) {
    state.loadingMessage = message;
  },
  resetDeploymentStatus(state: PortalState) {
    state.isError = false;
    state.isSuccess = false;
  },
  setXsd(state: PortalState, payload: any) {
    state.xsd = payload;
  },
};
