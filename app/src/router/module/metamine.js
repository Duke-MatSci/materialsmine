const metamineRoutes = [
  {
    path: '',
    name: 'HomeMM',
    component: () => import(/* webpackChunkName: "homemm" */ '@/pages/metamine/Home.vue'),
    meta: { requiresAuth: false }
  }
]

export default metamineRoutes
