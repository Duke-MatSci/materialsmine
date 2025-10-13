import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import store from '@/store';
import ExplorerBase from '@/pages/explorer/Base.vue';
import MetamineBase from '@/pages/metamine/Base.vue';
import NanomineBase from '@/pages/nanomine/Base.vue';
import PortalBase from '@/pages/portal/Base.vue';
import XsdBase from '@/pages/portal/curation/xsd/Base.vue';
import nanomineRoutes from '@/router/module/nanomine';
import metamineRoutes from '@/router/module/metamine';
import explorerRoutes from '@/router/module/explorer';
import portalRoutes from '@/router/module/portal';
import xsdRoutes from '@/router/module/xsd';
import nsRoutes from './module/ns';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'Home',
    redirect: { name: 'HomeNM' },
  },
  {
    path: '/nm',
    component: NanomineBase,
    children: [...nanomineRoutes],
  },
  {
    path: '/ns',
    component: () => import('@/pages/ns/Base.vue'),
    children: [...nsRoutes],
  },
  {
    path: '/mm',
    component: MetamineBase,
    children: [...metamineRoutes],
  },
  {
    path: '/explorer',
    component: ExplorerBase,
    children: [...explorerRoutes],
  },
  {
    path: '/xsd',
    component: XsdBase,
    children: [...xsdRoutes],
  },
  {
    path: '/portal',
    component: PortalBase,
    children: [...portalRoutes],
  },
  {
    path: '/auth/:auth',
    component: () => import('@/auth/auth.vue'),
  },
  {
    path: '/countdown',
    component: () => import('@/pages/CountDown.vue'),
  },
  { path: '/explorer:notFound(.*)', component: () => import('@/pages/NotFound.vue') },
  { path: '/mm:notFound(.*)', component: () => import('@/pages/NotFound.vue') },
  { path: '/nm:notFound(.*)', component: () => import('@/pages/NotFound.vue') },
  { path: '/:notFound(.*)', component: () => import('@/pages/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }
    return { top: 0, left: 0 };
  },
});

router.beforeEach(async function (to, from, next) {
  if (to.meta.requiresAuth && !store.getters['auth/isAuthenticated']) {
    if (!store.getters['auth/isAuthenticated']) {
      store.commit(
        'setSnackbar',
        {
          message: 'Re-authenticating...',
          duration: 1500,
        },
        { root: true }
      );

      await store.dispatch('auth/tryLogin');
      if (store.getters['auth/isAuthenticated']) {
        store.commit('setRouteInfo', { to, from });
        return next();
      }
    }
    next('');
  } else if (to.meta.requiresUnauth && store.getters.auth.isAuthenticated) {
    next();
    store.commit('setRouteInfo', { to, from });
  } else {
    next();
  }
});

export default router;
