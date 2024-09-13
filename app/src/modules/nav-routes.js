const HEADER_ROUTES = {
  explorer: [
    {
      path: '/explorer',
      label: 'Search',
      name: 'home',
      exact: true
    },
    {
      path: '/explorer/visualization',
      label: 'Visualization',
      exact: false
    },
    {
      path: '/explorer/curate',
      label: 'Curate',
      exact: false
    },
    {
      path: '/explorer/parameterized_query',
      label: 'Parameterized Query',
      name: 'parameterized_query',
      exact: true
    },
    {
      path: '/explorer/sparql',
      label: 'SPARQL Query',
      name: 'sparql',
      exact: true
    }
  ],
  ns: [
    {
      path: '/ns',
      label: 'Search',
      name: 'home',
      exact: true
    },
    {
      path: '/ns/classes',
      label: 'Classes',
      exact: true
    },
    // {
    //   path: '/ns/properties',
    //   label: 'Properties',
    //   exact: true
    // },
    {
      path: '/ns/visualize',
      label: 'Visualize',
      exact: true
    },
    {
      path: '/ns/submissions',
      label: 'Submissions',
      exact: true
    }
  ]
}

export { HEADER_ROUTES }
