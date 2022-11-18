import Vue from 'vue'
import VueApollo from 'vue-apollo'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'
import router from './router'
import apollo from './modules/gql/apolloClient'

const BASE = window.location.origin
const uri = `${BASE}/api/graphql`

Vue.use(VueApollo)
Vue.use(VueMaterial)
Vue.config.productionTip = false

new Vue({
  store,
  router,
  apolloProvider: apollo(uri),
  render: h => h(App)
}).$mount('#app')
