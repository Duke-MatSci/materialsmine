import { RouteRecordRaw } from 'vue-router';

const xsdRoutes: Array<RouteRecordRaw> = [
  {
    path: 'xsd-view',
    name: 'XsdView',
    component: () => import('@/pages/portal/curation/xsd/XsdViewer.vue'),
    meta: { requiresAuth: true },
  },
];

// export default xsdRoutes;
