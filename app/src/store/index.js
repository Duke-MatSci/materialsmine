import Vue from 'vue'
import Vuex from 'vuex'
import authModule from './modules/auth/index.js'
import explorer from './modules/explorer/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth: authModule,
    explorer
  }
})
