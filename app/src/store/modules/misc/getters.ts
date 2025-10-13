import { MiscState, AppHeaderInfo, Snackbar, RouteInfo } from './mutations';

export default {
  appHeaderInfo(state: MiscState): AppHeaderInfo {
    return state.appHeaderInfo;
  },
  countDownDate(state: MiscState): number {
    return state.countDownDate;
  },
  dialogBox(state: MiscState): boolean {
    return state.dialogBox;
  },
  getSnackbar(state: MiscState): Snackbar {
    return state.snackbar;
  },
  getRouteInfo(state: MiscState): RouteInfo {
    return state.routeInfo;
  }
};
