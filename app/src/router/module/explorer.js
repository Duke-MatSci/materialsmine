const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'visualization',
    name: 'ExplorerVisualization',
    meta: { requiresAuth: false }
  },
  {
    path: 'create',
    name: 'ExplorerCreate',
    meta: { requiresAuth: false }
  },
  {
    path: 'chart/view/:uri',
    name: 'ChartView',
    component: () => import('@/pages/explorer/vega/view/VegaView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'sample/:label',
    name: 'SampleView',
    component: () => import('@/pages/explorer/Sample.vue'),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
