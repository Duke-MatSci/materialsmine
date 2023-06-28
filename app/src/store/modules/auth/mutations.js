export default {
  setUser (state, payload) {
    state.token = payload.token
    state.userId = payload.userId
    state.displayName = payload.displayName
    state.isAdmin = payload.isAdmin
    state.didAutoLogout = false
    state.user = { surName: payload?.surName, givenName: payload?.givenName }
  },
  setAutoLogout (state) {
    state.didAutoLogout = true
  }
}
