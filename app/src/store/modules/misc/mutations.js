export default {
  setAppHeaderInfo (state, info) {
    state.appHeaderInfo = info
  },
  setDialogBox (state) {
    state.dialogBox = !state.dialogBox
  },
  setSnackbar (
    state,
    { message, action = null, duration = false, callToActionText = 'Retry' }
  ) {
    state.snackbar = {
      message,
      action,
      duration,
      callToActionText
    }
  },
  resetSnackbar (state) {
    state.snackbar = {
      message: '',
      action: null,
      duration: 0, // Indicate reset
      callToActionText: 'Retry'
    }
  },
  setUploadedFile (state, str) {
    state.uploadedFile = str
  }
}
