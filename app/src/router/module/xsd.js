const xsdRoutes = [
  {
    path: 'xsd-view',
    name: 'XsdView',
    component: () => import('@/pages/portal/curation/xsd/XsdViewer.vue'),
    meta: { requiresAuth: true }
  }
]

export default xsdRoutes
