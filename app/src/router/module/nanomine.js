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
    path: 'tools',
    component: () => import(/* webpackChunkName: "toolbase" */ '@/pages/nanomine/tools/ToolBase.vue'),
    children: [
      {
        path: 'module_homepage',
        alias: '',
        props: { toolProp: 'ModuleTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'mcr_homepage',
        props: { toolProp: 'MCRTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'binarization_homepage',
        props: { toolProp: 'BinarizationTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'characterization_homepage',
        props: { toolProp: 'CharacterizationTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'reconstruction_homepage',
        props: { toolProp: 'ReconstructionTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'simtools',
        props: { toolProp: 'SimulationTools' },
        component: () => import(/* webpackChunkName: "simtools" */ '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'dynamfit',
        name: 'Dynamfit',
        component: () => import(/* webpackChunkName: "modtools" */ '@/pages/nanomine/tools/dynamfitTool/Dynamfit.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'dynamfitResult',
        name: 'DynamfitResult',
        component: () => import(/* webpackChunkName: "modtools" */ '@/pages/nanomine/tools/dynamfitResult/DynamfitResult.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'plot-curation',
        name: 'CsvPlotter',
        component: () => import(/* webpackChunkName: "plotcuration" */ '@/pages/nanomine/tools/csvPlotter/CsvPlotter.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'chemprops',
        name: 'ChemProps',
        component: () => import(/* webpackChunkName: "chemprops" */ '@/pages/nanomine/tools/chemProps/ChemProps.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'chempropsapitoken',
        name: 'ChemPropsAPIToken',
        component: () => import(/* webpackChunkName: "chemprops" */ '@/pages/nanomine/tools/chemPropsAPIToken/ChemPropsAPIToken.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: 'about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/nanomine/teams/Teams.vue'),
    meta: { requiresAuth: false }
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
