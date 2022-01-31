const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/explorer/sample/:label',
    name: 'Sample View',
    component: () => import('@/pages/explorer/Sample.vue'),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
