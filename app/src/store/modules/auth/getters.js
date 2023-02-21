export default {
  userId (state) {
    return state.userId
  },
  token (state) {
    return state.token
  },
  displayName (state) {
    return state.displayName
  },
  isAuthenticated (state) {
    return !!state.token
  },
  didAutoLogout (state) {
    return state.didAutoLogout
  },
  user (state) {
    return state.user
  }
}
