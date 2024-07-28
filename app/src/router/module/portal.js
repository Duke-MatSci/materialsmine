const portalRoutes = [
  {
    path: '',
    name: 'PortalHome',
    component: () => import('@/pages/portal/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'general-deployment',
    name: 'GeneralDeployment',
    component: () => import('@/pages/portal/deploy/GeneralDeployment.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'ontology-deployment',
    name: 'OntologyDeployment',
    component: () => import('@/pages/portal/deploy/OntologyDeployment.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'contact-inquiry',
    name: 'ContactInquiry',
    component: () => import('@/pages/portal/enquiries/ContactInquiry.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'resolved-inquiries',
    name: 'ResolvedInquiries',
    component: () => import('@/pages/portal/enquiries/ResolveInquiry.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'favoritechart',
    name: 'AdminFavoriteChart',
    component: () => import('@/pages/portal/chart/FavoriteChart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'manage-chart',
    name: 'ManageChart',
    component: () => import('@/pages/portal/chart/ManageChart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'manage-curation',
    name: 'ManageCuration',
    component: () => import('@/pages/portal/curation/ManageCuration.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'view-curation',
    name: 'ViewCuration',
    component: () => import('@/pages/portal/curation/ViewCuration.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'view-schema',
    name: 'ViewSchema',
    component: () => import('@/pages/portal/curation/ViewSchema.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'users',
    name: 'ManageUsers',
    component: () => import('@/pages/portal/ManageUsers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'user/favorite-charts',
    name: 'FavoriteChart',
    component: () => import('@/pages/portal/chart/FavoriteChart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'user/approved-curations',
    name: 'ApprovedCuration',
    component: () =>
      import('@/pages/portal/user/curation/ApprovedCuration.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'user/unapproved-curations',
    name: 'UnapprovedCuratedXML',
    component: () =>
      import('@/pages/portal/user/curation/UnapprovedCuration.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'user',
    name: 'UserPortalHome',
    component: () => import('@/pages/portal/user/Home.vue'),
    meta: { requiresAuth: true }
  }
]

export default portalRoutes
