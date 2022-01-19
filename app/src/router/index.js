import Vue from "vue";
import VueRouter from "vue-router";
import store from "@/store/index.js";
import Home from "@/pages/Home.vue";
import nanomineRoutes from "@/router/module/nanomine";
import metamineRoutes from "@/router/module/metamine";
import explorerRoutes from "@/router/module/explorer";
Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  ...nanomineRoutes,
  ...metamineRoutes,
  ...explorerRoutes,
  { path: "/:notFound(.*)", component: Home }, // TODO: Not found component
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(function (to, _, next) {
  if (to.meta.requiresAuth && !store.getters.isAuthenticated) {
    next("/"); // TODO: Develop auth component
  } else if (to.meta.requiresUnauth && store.getters.isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
