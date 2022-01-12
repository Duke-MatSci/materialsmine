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
    path: '/nm',
    name: 'HomeNM',
    component: () => import(/* webpackChunkName: "homenm" */ '@/pages/nanomine/HomeNM/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/mm',
    name: 'HomeMM',
    component: () => import(/* webpackChunkName: "homemm" */ '@/pages/metamine/HomeMM/Home.vue'),
    meta: { requiresAuth: false }
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
  {
    path: '/how',
    name: 'HowTo',
    component: () => import(/* webpackChunkName: "howto" */ '@/pages/howTo/HowTo.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/sample/:label',
    name: 'Sample',
    component: () => import(/* webpackChunkName: "howto" */ '@/pages/sample/Sample.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/news',
    name: 'News',
    component: () => import(/* webpackChunkName: "news" */ '@/pages/researchnews/News.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/nm/xml-uploader',
    name: 'XmlUploader',
    component: () => import(/* webpackChunkName: "xmlupload" */ '@/pages/nanomine/xmlUploader/XmlUploader.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/nm/modtools',
    name: 'ModuleTools',
    component: () => import(/* webpackChunkName: "modtools" */ '@/pages/nanomine/tools/module/ModuleTools.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/nm/simtools',
    name: 'SimulationTools',
    component: () => import(/* webpackChunkName: "simtools" */ '@/pages/nanomine/tools/simulation/SimulationTools.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/nm/plot-curation',
    name: 'CsvPlotter',
    component: () => import(/* webpackChunkName: "plotcuration" */ '@/pages/nanomine/tools/csvPlotter/CsvPlotter.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/nm/chemprops',
    name: 'ChemProps',
    component: () => import(/* webpackChunkName: "chemprops" */ '@/pages/nanomine/tools/chemProps/ChemProps.vue'),
    meta: { requiresAuth: false }
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
