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
    name: 'ToolSets',
    path: 'tools',
    component: () => import(/* webpackChunkName: "toolsetbase" */ '@/pages/nanomine/toolSets/ToolSetBase.vue'),
    children: [
      {
        path: 'module_homepage',
        alias: '',
        props: { toolProp: 'ModuleTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/ModuleTools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'mcr_homepage',
        props: { toolProp: 'MCRTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/MCRTools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'binarization_homepage',
        props: { toolProp: 'BinarizationTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/BinarizationTools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'characterization_homepage',
        props: { toolProp: 'CharacterizationTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/CharacterizationTools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'reconstruction_homepage',
        props: { toolProp: 'ReconstructionTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/ReconstructionTools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'simtools',
        props: { toolProp: 'SimulationTools' },
        component: () => import(/* webpackChunkName: "toolsettemplate" */ '@/pages/nanomine/toolSets/SimulationTools.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    name: 'Tools',
    path: 'tools',
    component: () => import(/* webpackChunkName: "toolsetbase" */ '@/pages/nanomine/tools/ToolBase.vue'),
    children: [
      {
        path: 'dynamfit',
        name: 'Dynamfit',
        component: () => import(/* webpackChunkName: "dynamfit" */ '@/pages/nanomine/tools/dynamfitTool/Dynamfit.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'dynamfitResult',
        name: 'DynamfitResult',
        component: () => import(/* webpackChunkName: "dynamfitresult" */ '@/pages/nanomine/tools/dynamfitResult/DynamfitResult.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'plot-curation',
        name: 'CsvPlotter',
        component: () => import(/* webpackChunkName: "plotcuration" */ '@/pages/nanomine/csvPlotter/CsvPlotter.vue'),
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
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/chemPropsAPIToken/ChemPropsAPIToken.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'CorrelationCharacterize',
        name: 'CorrelationCharacterize',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/CorrelationCharacterize.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'CorrelationReconstruct',
        name: 'CorrelationReconstruct',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/CorrelationReconstruct.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'DescriptorCharacterize',
        name: 'DescriptorCharacterize',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/DescriptorCharacterize.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'DescriptorReconstruct',
        name: 'DescriptorReconstruct',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/DescriptorReconstruct.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'IntelligentCharacterize',
        name: 'IntelligentCharacterize',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/IntelligentCharacterize.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'Niblack',
        name: 'Niblack',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/NiblackBinarization.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'Otsu',
        name: 'Otsu',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/OtsuBinarization.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'SDFCharacterize',
        name: 'SDFCharacterize',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/SDFCharacterize.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'SDFReconstruct',
        name: 'SDFReconstruct',
        component: () => import(/* webpackChunkName: "chempropsapi" */ '@/pages/nanomine/tools/SDFReconstruct.vue'),
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
