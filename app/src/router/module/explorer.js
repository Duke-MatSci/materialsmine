const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'chart/view/:uri',
    name: 'ChartView',
    component: () => import('@/pages/explorer/vega/view/VegaView.vue')
  }
]

export default explorerRoutes
