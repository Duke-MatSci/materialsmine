export default {
  setUser (state, payload) {
    state.token = payload.token
    state.userId = payload.userId
    state.displayName = payload.displayName
    state.isAdmin = payload.isAdmin
    state.didAutoLogout = false
  },
  setAutoLogout (state) {
    state.didAutoLogout = true
  }
}
