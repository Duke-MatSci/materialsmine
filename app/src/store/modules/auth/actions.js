import router from '@/router'

let timer
export default {
  async login (context, payload) {
    return context.dispatch('auth', {
      ...payload,
      mode: 'login'
    })
  },

  async signup (context, payload) {
    return context.dispatch('auth', {
      ...payload,
      mode: 'signup'
    })
  },

  async auth (context, payload) {
    const mode = payload.mode
    let url = 'https://server.test'

    if (mode === 'signup') {
      url = 'https://server.test'
    }

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        returnSecureToken: true
      })
    })

    const responseData = await response.json()

    if (!response.ok) {
      const error = new Error(
        responseData.message || 'Failed to authenticate. Check your login data.'
      )
      throw error
    }

    return context.dispatch('authProcessor', responseData)
  },

  async authProcessor (context, payload) {
    const res = payload ? JSON.parse(payload) : {}

    // Reroute to home page
    // TODO (xxx): We should re-route to the page where user left off
    router.push('/nm')
    context.commit('setSnackbar', {
      message: 'Authenticating...',
      duration: 3000
    }, { root: true })

    const token = res.token ?? null
    const userId = res.userId ?? null
    const displayName = res.displayName ?? null
    const expiresIn = 9000 * 60 * 60
    const expirationDate = new Date().getTime() + expiresIn

    if (token && userId && displayName) {
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      localStorage.setItem('displayName', displayName)
      localStorage.setItem('tokenExpiration', expirationDate)

      timer = setTimeout(function () {
        context.dispatch('autoLogout')
      }, expiresIn)
    }

    context.commit('setUser', { token, userId, displayName })
  },

  tryLogin (context) {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const displayName = localStorage.getItem('displayName')
    const tokenExpiration = localStorage.getItem('tokenExpiration')

    const expiresIn = +tokenExpiration - new Date().getTime()

    if (expiresIn < 0) {
      return context.dispatch('notifyUser')
    }

    timer = setTimeout(function () {
      context.dispatch('autoLogout')
    }, expiresIn)

    if (token && userId && displayName) {
      context.commit('setUser', { token, userId, displayName })
    }
  },

  logout (context) {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('displayName')
    localStorage.removeItem('tokenExpiration')

    const meta = router.currentRoute?.meta
    if (meta?.requiresAuth) {
      router.push('/nm')
    }

    clearTimeout(timer)

    context.commit('setUser', {
      token: null,
      userId: null,
      displayName: null
    })
  },

  autoLogout (context) {
    context.dispatch('logout')
    context.commit('setAutoLogout')
  },

  notifyUser (context) {
    context.commit('setSnackbar', {
      message: 'This page requires login to access',
      duration: 5000
    }, { root: true })
  }
}
