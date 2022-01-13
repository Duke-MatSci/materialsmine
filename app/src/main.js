import Vue from 'vue'
import VueMaterial from 'vue-material'
import vPlayBack from 'v-playback'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

Vue.use(VueMaterial)
Vue.use(vPlayBack)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
