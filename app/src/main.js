import Vue from 'vue'
import ApolloClient from 'apollo-boost'
import VueApollo from 'vue-apollo'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'
import router from './router'

const BASE = window.location.origin
const uri = `${BASE}/api/graphql`

const apolloClient = new ApolloClient({
  uri
})

const apolloProvider = new VueApollo({
  defaultClient: apolloClient
})

Vue.use(VueApollo)
Vue.use(VueMaterial)
Vue.config.productionTip = false

new Vue({
  store,
  router,
  apolloProvider,
  render: h => h(App)
}).$mount('#app')
