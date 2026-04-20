import { RouteRecordRaw } from 'vue-router';
import HomeMM from '@/pages/metamine/Home.vue';

const metamineRoutes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'HomeMM',
    component: HomeMM,
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'teams',
    name: 'Teams',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/nanomine/teams/Teams.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'pixelunit',
    name: 'PixelUnit',
    component: () =>
      import(/* webpackChunkName: "pixelunit" */ '@/pages/metamine/PixelUnit/PixelUnit.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'metamaterial_visualization',
    name: 'MetamaterialPlot',
    component: () =>
      import(/* webpackChunkName: "about" */ '@/pages/metamine/visualization/MetamaterialPlot.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'metamaterial_visualization_nu',
    name: 'PairwisePlot',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/metamine/visualizationNU/PairwisePlot.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'metamaterial_visualization_nu/hist',
    name: 'Histogram',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/metamine/visualizationNU/HistogramPlot.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'metamaterial_visualization_nu/scatter',
    name: 'Scatter',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/metamine/visualizationNU/ScatterPlot.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: 'metamaterial_visualization_nu/umap',
    name: 'Umap',
    component: () => import(/* webpackChunkName: "about" */ '@/pages/metamine/visualizationNU/UmapPlot.vue'),
    meta: {
      requiresAuth: false,
    },
  },
];

export default metamineRoutes;
