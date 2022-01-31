const explorerRoutes = [
  {
    path: '',
    name: 'ExplorerHome',
    component: () => import('@/pages/explorer/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    // plus sign allows for matching DOIs which often have more than one segment
    // i.e. 10.1063/1.5046839
    // without plus sign, second segment is not recognized
    path: '/explorer/article/:doi+',
    name: 'Article',
    component: () => import('@/pages/explorer/article/Article.vue'),
    meta: { requiresAuth: false }
  }
]

export default explorerRoutes
