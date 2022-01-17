const metamineRoutes = [
	{
    path: '/mm',
    name: 'Home',
    component: () => import(/* webpackChunkName: "homemm" */ '@/pages/metamine/Home/Home.vue'),
    meta: { requiresAuth: false }
  },
]

export default metamineRoutes;