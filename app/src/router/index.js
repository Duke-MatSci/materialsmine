import { defineAsyncComponent } from 'vue';
import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/Home.vue";

const AboutPage = defineAsyncComponent(() =>
  import('../pages/About.vue')
);

// route level code-splitting
// this generates a separate chunk (about.[hash].js) for this route
// which is lazy-loaded when the route is visited.
const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/about",
    component: AboutPage,
    meta: { requiresAuth: true }
  },
  { path: '/:notFound(.*)', component: Home } //TODO: Not found component
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(function(to, _, next) {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next('/'); //TODO: Develop auth component
  } else if (to.meta.requiresUnauth && store.getters.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
