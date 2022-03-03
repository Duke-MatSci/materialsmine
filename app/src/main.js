import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import App from './App.vue'
import './registerServiceWorker'
import store from './store'
import router from './router'
import VueSocketIO from 'vue-socket.io'
import SocketIO from 'socket.io-client'

Vue.use(VueMaterial)
Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  // debug: true,
  connection: SocketIO({ path: '/nmr/socket.io', port: 3000 })
}))

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
