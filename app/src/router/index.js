import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store/index.js'
import Home from '@/pages/Home.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '@/pages/About.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/:notFound(.*)', component: Home } // TODO: Not found component
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(function (to, _, next) {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/') // TODO: Develop auth component
  } else if (to.meta.requiresUnauth && store.getters.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
