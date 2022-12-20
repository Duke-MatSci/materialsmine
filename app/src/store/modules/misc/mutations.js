export default {
  setAppHeaderInfo (state, info) {
    state.appHeaderInfo = info
  },
  setDialogBox (state) {
    state.dialogBox = !state.dialogBox
  },
  // used for snackbar 1 (props)
  setSnackbar (state) {
    state.snackbar = !state.snackbar
  },
  // used for snackbar 2 (watcher)
  setSnackMsg (state, snack) {
    state.snackMsg = snack
  }
}
