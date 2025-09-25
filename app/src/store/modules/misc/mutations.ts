export default {
  setAppHeaderInfo(state: any, info: any): void {
    state.appHeaderInfo = info;
  },
  setDialogBox(state: any): void {
    state.dialogBox = !state.dialogBox;
  },
  setSnackbar(
    state: any,
    { message, action = null, duration = false, callToActionText = 'Retry' }: any
  ): void {
    state.snackbar = {
      message,
      action,
      duration,
      callToActionText,
    };
  },
  resetSnackbar(state: any): void {
    state.snackbar = {
      message: '',
      action: null,
      duration: 0, // Indicate reset
      callToActionText: 'Retry',
    };
  },
  setUploadedFile(state: any, str: string): void {
    state.uploadedFile = str;
  },
  setRouteInfo(state: any, info: any): void {
    state.routeInfo = info ?? { to: {}, from: {} };
  },
};
