const nsRoutes = [
  {
    path: '',
    name: 'Namespace',
    component: () => import('@/pages/ns/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: ':namespace',
    name: 'Namespaces',
    component: () => import('@/pages/ns/Home.vue'),
    meta: { requiresAuth: false }
  }
]

export default nsRoutes
