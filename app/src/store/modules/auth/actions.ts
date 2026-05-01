import router from '@/router';
import { getTokenExp, clearAuthStorage } from '@/modules/auth-utils';

let timer: any;

// Helper function to set local storage items
const setAuthStorage = (data: any): void => {
  const { token, userId, displayName, surName, givenName, isAdmin, expirationDate } = data;
  const items = [
    { key: 'token', value: token },
    { key: 'userId', value: userId },
    { key: 'displayName', value: displayName },
    { key: 'surName', value: surName },
    { key: 'givenName', value: givenName },
    { key: 'isAdmin', value: isAdmin },
    { key: 'tokenExpiration', value: expirationDate },
  ];

  items.forEach(({ key, value }) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, String(value));
    }
  });
};

// Helper function to get auth data from local storage
const getAuthFromStorage = (): any => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const displayName = localStorage.getItem('displayName');
  const surName = localStorage.getItem('surName');
  const givenName = localStorage.getItem('givenName');
  const localStorageIsAdmin = localStorage.getItem('isAdmin');
  const tokenExpiration = localStorage.getItem('tokenExpiration');

  // Required since local storage return booleans as string
  const isAdmin = localStorageIsAdmin === 'true';

  return {
    token,
    userId,
    displayName,
    surName,
    givenName,
    isAdmin,
    tokenExpiration,
  };
};

export default {
  async login(context: any, payload: any): Promise<any> {
    return context.dispatch('auth', {
      ...payload,
      mode: 'login',
    });
  },

  async signup(context: any, payload: any): Promise<any> {
    return context.dispatch('auth', {
      ...payload,
      mode: 'signup',
    });
  },

  async auth(context: any, payload: any): Promise<any> {
    const mode = payload.mode;
    let url = 'https://server.test';

    if (mode === 'signup') {
      url = 'https://server.test';
    }

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        returnSecureToken: true,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = new Error(
        responseData.message || 'Failed to authenticate. Check your login data.'
      );
      throw error;
    }

    return context.dispatch('authProcessor', responseData);
  },

  async authProcessor(context: any, payload: any): Promise<any> {
    const res = payload ? JSON.parse(payload) : {};
    // Reroute to home page
    router.push('/nm');

    context.commit(
      'setSnackbar',
      {
        message: 'Authenticating...',
        duration: 3000,
      },
      { root: true }
    );

    const token = res.token ?? null;
    const userId = res.userId ?? null;
    const displayName = res.displayName ?? null;
    const surName = res.surName ?? null;
    const givenName = res.givenName ?? null;
    const isAdmin = res.isAdmin ?? false;

    const exp = token ? getTokenExp(token) : null;
    const expirationDate = exp ? exp * 1000 : new Date().getTime() + 8 * 60 * 60 * 1000;
    const expiresIn = expirationDate - Date.now();

    if (token && userId && displayName) {
      setAuthStorage({
        token,
        userId,
        displayName,
        surName,
        givenName,
        isAdmin,
        expirationDate,
      });

      timer = setTimeout(function () {
        context.dispatch('autoLogout');
      }, expiresIn);
    }

    return context.commit('setUser', {
      token,
      userId,
      displayName,
      isAdmin,
      surName,
      givenName,
    });
  },

  tryLogin(context: any): void {
    const authData = getAuthFromStorage();
    const { token, userId, displayName, surName, givenName, isAdmin, tokenExpiration } = authData;

    const expiresIn = +tokenExpiration - new Date().getTime();

    if (expiresIn < 0) {
      context.dispatch('autoLogout');
      return context.dispatch('notifyUser');
    }

    timer = setTimeout(function () {
      context.dispatch('autoLogout');
    }, expiresIn);

    if (token && userId && displayName) {
      context.commit('setUser', {
        token,
        userId,
        displayName,
        isAdmin,
        surName,
        givenName,
      });
    }
  },

  logout(context: any): void {
    clearAuthStorage();
    clearTimeout(timer);

    context.commit('setUser', {
      token: null,
      userId: null,
      displayName: null,
      isAdmin: false,
      surName: null,
      givenName: null,
    });

    const currentRoute = (router as any).currentRoute;
    if (currentRoute?.meta?.requiresAuth) {
      router.push('/nm');
      context.dispatch('notifyUser');
    }
  },

  autoLogout(context: any): void {
    context.dispatch('logout');
    context.commit('setAutoLogout');
  },

  notifyUser(context: any): void {
    context.commit(
      'setSnackbar',
      {
        message: 'This page requires login to access',
        duration: 5000,
      },
      { root: true }
    );
  },
};
