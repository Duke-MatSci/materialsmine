import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store/index.js'
import ExplorerBase from '@/pages/explorer/Base.vue'
import MetamineBase from '@/pages/metamine/Base.vue'
import NanomineBase from '@/pages/nanomine/Base.vue'
import PortalBase from '@/pages/portal/Base.vue'
import XsdBase from '@/pages/portal/curation/xsd/Base.vue'
import NotFound from '@/pages/NotFound.vue'
import nanomineRoutes from '@/router/module/nanomine'
import metamineRoutes from '@/router/module/metamine'
import explorerRoutes from '@/router/module/explorer'
import portalRoutes from '@/router/module/portal'
import xsdRoutes from '@/router/module/xsd'
import nsRoutes from './module/ns'
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
    children: [...nanomineRoutes]
  },
  {
    path: '/ns',
    component: () => import('@/pages/ns/Base.vue'),
    children: [...nsRoutes]
  },
  {
    path: '/mm',
    component: MetamineBase,
    children: [...metamineRoutes]
  },
  {
    path: '/explorer',
    component: ExplorerBase,
    children: [...explorerRoutes]
  },
  {
    path: '/xsd',
    component: XsdBase,
    children: [...xsdRoutes]
  },
  {
    path: '/portal',
    component: PortalBase,
    children: [...portalRoutes]
  },
  {
    path: '/auth/:auth',
    component: () => import('@/auth/auth.vue')
  },
  {
    path: '/countdown',
    component: () => import('@/pages/CountDown.vue')
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

router.beforeEach(async function (to, from, next) {
  if (to.meta.requiresAuth && !store.getters['auth/isAuthenticated']) {
    if (!store.getters['auth/isAuthenticated']) {
      store.commit(
        'setSnackbar',
        {
          message: 'Re-authenticating...',
          duration: 1500
        },
        { root: true }
      )

      await store.dispatch('auth/tryLogin')
      if (store.getters['auth/isAuthenticated']) {
        store.commit('setRouteInfo', { to, from })
        return next()
      }
    }
    next('')
  } else if (to.meta.requiresUnauth && store.getters.auth.isAuthenticated) {
    store.commit('setRouteInfo', { to, from })
    next()
  } else {
    store.commit('setRouteInfo', { to, from })
    next()
  }
})

export default router
