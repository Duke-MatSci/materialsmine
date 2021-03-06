import ChartBase from '@/pages/explorer/chart/Base.vue'
import ImageBase from '@/pages/explorer/image/Base.vue'
const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    // DOIs usually have more than one segment, i.e. 10.1063/1.5046839
    // extended path regex needed to match those multiple segments
    path: 'article/:doi+',
    name: 'Article',
    component: () => import('@/pages/explorer/article/Article.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'visualization',
    name: 'ExplorerVisualization',
    component: () => import('@/pages/explorer/Visualization.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'curate',
    name: 'ExplorerCurate',
    component: () => import('@/pages/explorer/Curate.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'chart',
    component: ChartBase,
    children: [
      {
        path: '',
        name: 'ChartGallery',
        component: () => import('@/pages/explorer/Gallery.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'edit/:chartId',
        name: 'ChartEdit',
        props: true,
        meta: { requiresAuth: false }
      },
      {
        path: 'create',
        name: 'ChartCreate',
        meta: { requiresAuth: false }
      },
      {
        path: 'view/:chartId',
        name: 'ChartView',
        component: () => import('@/pages/explorer/chart/view/VegaView.vue'),
        props: true,
        meta: { requiresAuth: false }
      },
      {
        path: 'voyager/:chartId',
        name: 'ChartDataVoyager',
        component: () => import('@/pages/explorer/chart/datavoyager/DataVoyagerPage.vue'),
        props: true,
        meta: { requiresAuth: false }
      },
      {
        path: 'voyager',
        name: 'NewChartDataVoyager',
        component: () => import('@/pages/explorer/chart/datavoyager/DataVoyagerPage.vue'),
        props: true,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: 'images',
    component: ImageBase,
    children: [
      {
        path: '',
        name: 'ImageGallery',
        component: () => import('@/pages/explorer/image/Image.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: ':id/:fileId',
        name: 'ImageDetailView',
        component: () => import('@/pages/explorer/image/ImageDetailView.vue'),
        props: true,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: 'sample/:label',
    name: 'SampleView',
    component: () => import('@/pages/explorer/sample/Sample.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'filter/property/:label',
    name: 'FacetFilterView',
    component: () => import('@/pages/explorer/FacetFilter.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'parameterized_query',
    name: 'ParameterizedQuery',
    component: () =>
      import(
        '@/pages/explorer/parameterized-query/parameterized-query-page.vue'
      ),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
