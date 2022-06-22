import Vue from 'vue'
import ApolloClient from 'apollo-boost'
import VueApollo from "vue-apollo";
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'
import router from './router'

const BASE = process.env.SERVICE_PORT || 'http://localhost:3001'
const uri = `${BASE}/api/graphql`;
const apolloProvider = new VueApollo({
  defaultClient: new ApolloClient({
    uri
  })
});

Vue.use(VueApollo)
Vue.use(VueMaterial)
Vue.config.productionTip = false

new Vue({
  store,
  router,
  apolloProvider,
  render: h => h(App)
}).$mount('#app')
