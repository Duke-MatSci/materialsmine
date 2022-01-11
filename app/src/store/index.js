import Vue from 'vue'
import Vuex from 'vuex'
import authModule from './modules/auth/index.js'
import miscModule from './modules/misc/index.js'
import howtoModule from './modules/howto/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    auth: authModule,
    misc: miscModule,
    howto: howtoModule
  }
})
