const explorerRoutes = [
	{
		path: '/explorer',
		name: 'ExplorerHome',
		component: () => import('@/pages/explorer/Home.vue'),
		meta: { requiresAuth: false }
	}
]

export default explorerRoutes
