import ChartBase from '@/pages/explorer/chart/Base.vue'
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
    path: 'chart',
    component: ChartBase,
    children: [
      {
        path: '',
        name: 'ChartGallery',
        meta: { requiresAuth: false }
      },
      {
        path: 'edit/:uri',
        name: 'ChartEdit',
        meta: { requiresAuth: false }
      },
      {
        path: 'create',
        name: 'ChartCreate',
        meta: { requiresAuth: false }
      },
      {
        path: 'view/:uri',
        name: 'ChartView',
        component: () => import('@/pages/explorer/chart/view/VegaView.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: 'sample/:label',
    name: 'SampleView',
    component: () => import('@/pages/explorer/sample/Sample.vue'),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
