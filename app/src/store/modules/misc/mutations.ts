export interface AppHeaderInfo {
  icon: string;
  pagetype: string;
  name: string;
  subtitle: string;
}

export interface Snackbar {
  message: string;
  action: (() => void) | null;
  duration: boolean | number;
  callToActionText: string;
}

export interface RouteInfo {
  to?: Record<string, any>;
  from?: Record<string, any>;
  [key: string]: any;
}

export interface MiscState {
  appHeaderInfo: AppHeaderInfo;
  dialogBox: boolean;
  snackbar: Snackbar;
  countDownDate: number;
  uploadedFile: string | null;
  routeInfo: RouteInfo;
}

interface SnackbarPayload {
  message: string;
  action?: (() => void) | null;
  duration?: boolean | number;
  callToActionText?: string;
}

export default {
  setAppHeaderInfo(state: MiscState, info: AppHeaderInfo) {
    state.appHeaderInfo = info;
  },
  setDialogBox(state: MiscState) {
    state.dialogBox = !state.dialogBox;
  },
  setSnackbar(
    state: MiscState,
    { message, action = null, duration = false, callToActionText = 'Retry' }: SnackbarPayload
  ) {
    state.snackbar = {
      message,
      action,
      duration,
      callToActionText
    };
  },
  resetSnackbar(state: MiscState) {
    state.snackbar = {
      message: '',
      action: null,
      duration: 0, // Indicate reset
      callToActionText: 'Retry'
    };
  },
  setUploadedFile(state: MiscState, str: string) {
    state.uploadedFile = str;
  },
  setRouteInfo(state: MiscState, info: RouteInfo | null) {
    state.routeInfo = info ?? { to: {}, from: {} };
  }
};
