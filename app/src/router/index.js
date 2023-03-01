import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store/index.js'
import ExplorerBase from '@/pages/explorer/Base.vue'
import MetamineBase from '@/pages/metamine/Base.vue'
import NanomineBase from '@/pages/nanomine/Base.vue'
import NotFound from '@/pages/NotFound.vue'
import nanomineRoutes from '@/router/module/nanomine'
import metamineRoutes from '@/router/module/metamine'
import explorerRoutes from '@/router/module/explorer'
Vue.use(VueRouter)

const routes = [
  {
    path: '',
    name: 'Home',
    redirect: { name: 'HomeNM' }
  },
  {
    path: '/nm',
    component: NanomineBase,
    children: [
      ...nanomineRoutes
    ]
  },
  {
    path: '/mm',
    component: MetamineBase,
    children: [
      ...metamineRoutes
    ]
  },
  {
    path: '/explorer',
    component: ExplorerBase,
    children: [
      ...explorerRoutes
    ]
  },
  {
    path: '/auth/:auth',
    component: () => import('@/auth/auth.vue')
  },
  { path: '/explorer:notFound(.*)', component: NotFound },
  { path: '/mm:notFound(.*)', component: NotFound },
  { path: '/nm:notFound(.*)', component: NotFound },
  { path: '/:notFound(.*)', component: NotFound }
]

const router = new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior (to, _, prevPosition) {
    if (prevPosition) {
      return prevPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { x: 0, y: 0 }
  }
})

router.beforeEach(async function (to, _, next) {
  if (to.meta.requiresAuth && !store.getters['auth/isAuthenticated']) {
    if (!store.getters['auth/isAuthenticated']) {
      store.commit('setSnackbar', {
        message: 'Re-authenticating...',
        duration: 1500
      }, { root: true })

      await store.dispatch('auth/tryLogin')
      if (store.getters['auth/isAuthenticated']) {
        next()
      }
    }
    next(false)
  } else if (to.meta.requiresUnauth && store.getters.auth.isAuthenticated) {
    next()
  } else {
    next()
  }
})

export default router
