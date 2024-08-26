const nsRoutes = [
  {
    path: '',
    name: 'Namespace',
    component: () => import('@/pages/ns/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'classes',
    name: 'Classes',
    component: () => import('@/pages/ns/Classes.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'properties',
    name: 'Properties',
    component: () => import('@/pages/ns/Properties.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'submissions',
    name: 'Submissions',
    component: () => import('@/pages/ns/Submissions.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: 'visualize',
    name: 'Visualize',
    component: () => import('@/pages/ns/Visualize.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: ':namespace(.*)*',
    name: 'Namespaces',
    component: () => import('@/pages/ns/Home.vue'),
    meta: { requiresAuth: false }
  }
];

export default nsRoutes;
