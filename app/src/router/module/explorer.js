const explorerRoutes = [
  {
    path: '/explorer',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/explorer/sample/:label',
    name: 'Sample View',
    component: () => import('@/pages/explorer/sample/Sample.vue'),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
