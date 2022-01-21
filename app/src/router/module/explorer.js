const explorerRoutes = [
  {
    path: '/explorer',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chart/:id/edit',
    name: 'ChartEdit',
    component: () => import('@/pages/explorer/ChartEditor.vue')
  },
  {
    path: '/chart/:id/view',
    name: 'ChartView',
    component: () => import('@/pages/explorer/ChartViewer.vue')
  }
]

export default explorerRoutes
