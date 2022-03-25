const metamineRoutes = [
  {
    path: '',
    name: 'HomeMM',
    component: () => import(/* webpackChunkName: "homemm" */ '@/pages/metamine/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'teams',
    name: 'Teams',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/nanomine/teams/Teams.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'pixelunit',
    name: 'PixelUnit',
    component: () => import(/* webpackChunkName: "pixelunit" */ '@/pages/metamine/PixelUnit/PixelUnit.vue'),
    meta: { requiresAuth: false }
  }
]

export default metamineRoutes
