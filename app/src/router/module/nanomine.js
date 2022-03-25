import { toolRoutes, toolSetRoutes } from './tools'

const nanomineRoutes = [
  {
    path: '',
    name: 'HomeNM',
    component: () => import(/* webpackChunkName: "homenm" */ '@/pages/nanomine/Home/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'xml-uploader',
    name: 'XmlUploader',
    component: () => import(/* webpackChunkName: "xmlupload" */ '@/pages/nanomine/xmlUploader/XmlUploader.vue'),
    meta: { requiresAuth: false }
  },
  {
    name: 'ToolSets',
    path: 'tools',
    component: () => import(/* webpackChunkName: "toolsetbase" */ '@/pages/nanomine/toolSets/ToolSetBase.vue'),
    children: [
      ...toolSetRoutes
    ]
  },
  {
    name: 'Tools',
    path: 'tools',
    component: () => import(/* webpackChunkName: "toolsetbase" */ '@/pages/nanomine/tools/ToolBase.vue'),
    children: [
      ...toolRoutes
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
