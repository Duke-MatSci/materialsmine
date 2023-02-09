export default {
  setAppHeaderInfo (state, info) {
    state.appHeaderInfo = info
  },
  setDialogBox (state) {
    state.dialogBox = !state.dialogBox
  },
  setSnackbar (state, { message, action = null, duration = null }) {
    state.snackbar = {
      message,
      action,
      duration
    }
  }
}
