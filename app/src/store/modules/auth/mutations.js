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
    return (state.didAutoLogout = true)
  },
  setLastPageVisit (state, payload) {
    const regex = /\/auth\//
    if (!regex.test(decodeURI(payload)) || payload !== '/') {
      return (state.lastPageVisited = payload)
    }
    return (state.lastPageVisited = 'payload')
  }
}
