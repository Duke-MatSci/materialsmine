export default {
  appHeaderInfo (state) {
    return state.appHeaderInfo
  },
  dialogBox (state) {
    return state.dialogBox
  },
  // used for snackbar 1 (props)
  snackbar (state) {
    return state.snackbar
  },
  // used for snackbar 2 (watcher)
  getSnackMsg (state) {
    return state.snackMsg
  }
}
