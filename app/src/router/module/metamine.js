const metamineRoutes = [
	{
    path: '/mm',
    name: 'HomeMM',
    component: () => import(/* webpackChunkName: "homemm" */ '@/pages/metamine/Home/Home.vue'),
    meta: { requiresAuth: false }
  },
]

export default metamineRoutes;