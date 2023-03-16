export default {
  setAppHeaderInfo (state, info) {
    state.appHeaderInfo = info
  },
  setDialogBox (state) {
    state.dialogBox = !state.dialogBox
  },
  setSnackbar (state, { message, action = null, duration = false }) {
    state.snackbar = {
      message,
      action,
      duration
    }
  }
}
