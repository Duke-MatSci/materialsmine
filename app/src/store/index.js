import { createStore } from "vuex";

import authModule from './modules/auth/index.js';

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    auth: authModule
  },
});
