import Vue from 'vue'
import Vuex from 'vuex'
import authModule from './modules/auth/index.js'
import explorer from './modules/explorer/index.js'
import miscModule from './modules/misc/index.js'
import vegaModule from './modules/vega/index.js'
import nanomine from './modules/nanomine/index.js'
import metamineNU from './modules/metamineNU/index.js'
import contact from './modules/contact/index.js'
import portal from './modules/portal/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth: authModule,
    explorer,
    misc: miscModule,
    vega: vegaModule,
    nanomine,
    metamineNU,
    contact,
    portal
  }
})
