export default {
  dockerVersions (state) {
    return state.dockerVersions
  },
  currentVersion (state) {
    return state.currentVersion
  },
  isSuccess (state) {
    return state.isSuccess
  },
  isError (state) {
    return state.isError
  },
  isLoading (state) {
    return state.isLoading
  },
  deploy (state) {
    return state.deploy
  },
  deploymentStatus (state) {
    return state.deploymentStatus
  },
  loadingMessage (state) {
    return state.loadingMessage
  },
  xsd (state) {
    return state.xsd
  }
}
