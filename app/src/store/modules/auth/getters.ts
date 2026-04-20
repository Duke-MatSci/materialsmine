export default {
  userId(state: any): any {
    return state.userId;
  },
  token(state: any): any {
    return state.token;
  },
  displayName(state: any): any {
    return state.displayName;
  },
  isAdmin(state: any): boolean {
    return state.isAdmin;
  },
  isAuthenticated(state: any): boolean {
    return !!state.token;
  },
  didAutoLogout(state: any): boolean {
    return state.didAutoLogout;
  },
  user(state: any): any {
    return state.user;
  },
  lastPageVisited(state: any): string {
    return state.lastPageVisited;
  },
};
