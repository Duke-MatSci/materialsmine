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
    path: 'tools',
    component: () => import('@/pages/explorer/tools/ToolsBase.vue'),
    children: [
      {
        path: '',
        name: 'ToolsExplorer',
        component: () => import('@/pages/explorer/Tools.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'dynamfit',
        name: 'DynamFit',
        component: () => import('@/pages/explorer/tools/dynamfit/DynamFit.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: 'curate',
    component: () => import('@/pages/explorer/curate/CurateBase.vue'),
    children: [
      {
        path: '',
        name: 'Curate',
        component: () => import('@/pages/explorer/Curate.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'spreadsheet',
        component: () =>
          import('@/pages/explorer/curate/spreadsheet/SpreadsheetBase.vue')
      },
      {
        path: 'spreadsheet/:datasetId',
        name: 'CurateSpreadsheet',
        props: true,
        component: () =>
          import('@/pages/explorer/curate/spreadsheet/SpreadsheetUpload.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'bulk',
        name: 'CurateBulk',
        component: () =>
          import(
            '@/pages/explorer/curate/spreadsheet/SpreadsheetUploadBulk.vue'
          ),
        meta: { requiresAuth: true }
      },
      {
        path: 'stepper',
        name: 'CurationForm',
        component: () =>
          import('@/pages/explorer/curate/form/CurationForm.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'stepper/edit',
        name: 'EditXmlCuration',
        component: () =>
          import('@/pages/explorer/curate/form/CurationForm.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: 'curate/edit',
    component: () => import('@/pages/explorer/curate/CurateBase.vue'),
    children: [
      {
        path: '',
        name: 'UserDatasets',
        component: () =>
          import('@/pages/explorer/curate/edit/UserDatasets.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'dataset/:id',
        name: 'DatasetSingleView',
        component: () => import('@/pages/explorer/curate/edit/Dataset.vue'),
        props: true,
        meta: { requiresAuth: false }
      },
      // Components don't exist yet for these
      {
        path: 'dataset/:id/:filesetId',
        name: 'FilesetSingleView',
        // component: () => import('@/pages/explorer/curate/edit/Fileset.vue'),
        props: true,
        meta: { requiresAuth: true }
      },
      {
        path: 'dataset/:id/:filesetId/:file',
        name: 'FileSingleView',
        // component: () => import('@/pages/explorer/curate/edit/File.vue'),
        props: true,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: 'curate/validlist',
    component: () => import('@/pages/explorer/curate/CurateBase.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'validList',
        component: () => import('@/pages/explorer/curate/validlist/XlsList.vue')
      },
      {
        path: 'update',
        name: 'xlsUpdate',
        component: () =>
          import('@/pages/explorer/curate/validlist/UpdateXlsList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'all',
        name: 'validListAll',
        component: () =>
          import('@/pages/explorer/curate/validlist/XlsListAll.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  // {
  //   path: 'stepper',
  //   name: 'CurateStepper',
  //   component: () => import('@/pages/explorer/curate/stepper/StepperForm.vue'),
  // },
  {
    path: 'curate/sdd',
    name: 'CurateSDD',
    component: () => import('@/pages/explorer/curate/sdd/SddForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'curate/sdd/edit/:datasetId',
    name: 'EditSDD',
    props: true,
    component: () => import('@/pages/explorer/curate/sdd/SddForm.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: 'curate/sdd/link/:datasetId',
  //   name: 'LinkSDD',
  //   props: true,
  //   component: () => import('@/pages/explorer/curate/sdd/SddLinking.vue'),
  //   meta: { requiresAuth: true }
  // },
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
      ...['editor/:type', 'editor/:type/:chartId(.*)'].map((path) => ({
        path,
        component: () => import('@/pages/explorer/chart/editor/Chart.vue'),
        props: true,
        meta: { requiresAuth: true }
      })),
      {
        path: 'view/:chartId(.*)',
        name: 'ChartView',
        component: () => import('@/pages/explorer/chart/view/VegaView.vue'),
        props: true,
        meta: { requiresAuth: false }
      },
      {
        path: 'voyager/:chartId(.*)',
        name: 'ChartDataVoyager',
        component: () =>
          import('@/pages/explorer/chart/datavoyager/DataVoyagerPage.vue'),
        props: true,
        meta: { requiresAuth: false }
      },
      {
        path: 'voyager',
        name: 'NewChartDataVoyager',
        component: () =>
          import('@/pages/explorer/chart/datavoyager/DataVoyagerPage.vue'),
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
    meta: { requiresAuth: true }
  },
  {
    path: 'sparql',
    name: 'Sparql',
    component: () => import('@/pages/explorer/Sparql.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'xmls',
    name: 'XmlGallery',
    component: () => import('@/pages/explorer/xml/Xml.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'xmlvisualizer/:id',
    name: 'XmlVisualizer',
    component: () => import('@/pages/explorer/xml/XmlLoader.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'dataset',
    component: ChartBase,
    children: [
      {
        path: '',
        name: 'DatasetGallery',
        component: () => import('@/pages/explorer/dataset/DatasetGallery.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: ':id',
        name: 'DatasetVisualizer',
        component: () => import('@/pages/explorer/dataset/Dataset.vue'),
        props: true,
        meta: { requiresAuth: false }
      }
    ]
  }
]

export default explorerRoutes
