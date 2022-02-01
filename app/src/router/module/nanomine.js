const nanomineRoutes = [
  {
    path: '',
    name: 'HomeNM',
    component: () => import(/* webpackChunkName: "homenm" */ '@/pages/nanomine/Home/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/xml-uploader',
    name: 'XmlUploader',
    component: () => import(/* webpackChunkName: "xmlupload" */ '@/pages/nanomine/xmlUploader/XmlUploader.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/modtools',
    name: 'ModuleTools',
    component: () => import(/* webpackChunkName: "modtools" */ '@/pages/nanomine/tools/module/ModuleTools.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/simtools',
    name: 'SimulationTools',
    component: () => import(/* webpackChunkName: "simtools" */ '@/pages/nanomine/tools/simulation/SimulationTools.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/plot-curation',
    name: 'CsvPlotter',
    component: () => import(/* webpackChunkName: "plotcuration" */ '@/pages/nanomine/tools/csvPlotter/CsvPlotter.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chemprops',
    name: 'ChemProps',
    component: () => import(/* webpackChunkName: "chemprops" */ '@/pages/nanomine/tools/chemProps/ChemProps.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/nanomine/teams/Teams.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'how',
    name: 'HowTo',
    component: () => import(/* webpackChunkName: "howto" */ '@/pages/nanomine/howTo/HowTo.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'news',
    name: 'News',
    component: () => import(/* webpackChunkName: "news" */ '@/pages/nanomine/researchnews/News.vue'),
    meta: { requiresAuth: false }
  }
]

export default nanomineRoutes
