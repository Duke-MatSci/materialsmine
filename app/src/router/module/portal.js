const portalRoutes = [
  {
    path: '',
    name: 'PortalHome',
    component: () => import('@/pages/portal/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'deploy',
    name: 'Deploy',
    component: () => import('@/pages/portal/Deploy.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: 'contact-inquiry',
    name: 'ContactInquiry',
    component: () =>
      import(
        '@/pages/portal/enquiries/ContactInquiry.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'resolved-inquiries',
    name: 'ResolvedInquiries',
    component: () =>
      import(
        '@/pages/portal/enquiries/ResolveInquiry.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'manage-chart',
    name: 'ManageChart',
    component: () =>
      import(
        '@/pages/portal/chart/ManageChart.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'delete-chart',
    name: 'DeleteChart',
    component: () =>
      import(
        '@/pages/portal/chart/DeleteChart.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'manage-curation',
    name: 'ManageCuration',
    component: () =>
      import(
        '@/pages/portal/curation/ManageCuration.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'view-curation',
    name: 'ViewCuration',
    component: () =>
      import(
        '@/pages/portal/curation/ViewCuration.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'view-schema',
    name: 'ViewSchema',
    component: () =>
      import(
        '@/pages/portal/curation/ViewSchema.vue'
      ),
    meta: { requiresAuth: true }
  },
  {
    path: 'users',
    name: 'ManageUsers',
    component: () =>
      import(
        '@/pages/portal/ManageUsers.vue'
      ),
    meta: { requiresAuth: true }
  }
]

export default portalRoutes
