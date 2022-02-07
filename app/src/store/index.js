import Vue from 'vue'
import Vuex from 'vuex'
import authModule from './modules/auth/index.js'
import explorer from './modules/explorer/index.js'
import miscModule from './modules/misc/index.js'
import nanomine from './modules/nanomine/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth: authModule,
    explorer,
    misc: miscModule,
    nanomine
  }
})
