import Vue from 'vue'
import Vuex from 'vuex'
import authModule from './modules/auth/index.js'
import explorer from './modules/explorer/index.js'
import miscModule from './modules/misc/index.js'
import howtoModule from './modules/howto/index.js'
import vegaModule from './modules/vega/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth: authModule,
    explorer,
    misc: miscModule,
    howto: howtoModule,
    vega: vegaModule
  }
})
