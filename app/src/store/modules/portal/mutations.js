export default {
  setDockerVersions (state, payload) {
    state.dockerVersions = payload
  },
  setCurrentVersion (state, payload) {
    state.currentVersion = payload
  },
  setSuccess (state, payload) {
    state.isSuccess = payload
  },
  setError (state, payload) {
    state.isError = payload
  },
  setLoading (state) {
    state.isLoading = !state.isLoading
  },
  setLoadingMessage (state, { message }) {
    state.loadingMessage = message
  },
  resetDeploymentStatus (state) {
    state.isError = false
    state.isSuccess = false
  },
  setXsd (state, payload) {
    state.xsd = payload
  }
}
