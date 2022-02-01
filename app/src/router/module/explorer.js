const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'chart/new',
    name: 'ChartNew',
    component: () => import('@/pages/explorer/vega/edit/VegaEdit.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'chart/:id',
    name: 'Chart',
    component: () => import('@/pages/explorer/vega/Base.vue'),
    children: [
      {
        path: '',
        alias: 'view',
        name: 'ChartView',
        component: () => import('@/pages/explorer/vega/view/VegaView.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'edit',
        name: 'ChartEdit',
        component: () => import('@/pages/explorer/vega/edit/VegaEdit.vue'),
        meta: { requiresAuth: false }
      }
    ]
  }
]

export default explorerRoutes
