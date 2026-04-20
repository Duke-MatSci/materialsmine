export default {
  setUser(state: any, payload: any): void {
    state.token = payload.token;
    state.userId = payload.userId;
    state.displayName = payload.displayName;
    state.isAdmin = payload.isAdmin;
    state.didAutoLogout = false;
    state.user = { surName: payload?.surName, givenName: payload?.givenName };
  },
  setAutoLogout(state: any): boolean {
    return (state.didAutoLogout = true);
  },
  setLastPageVisit(state: any, payload: string): string {
    const regex = /\/auth\//;
    if (!regex.test(decodeURI(payload)) || payload !== '/') {
      return (state.lastPageVisited = payload);
    }
    return (state.lastPageVisited = 'payload');
  },
};
