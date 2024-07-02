const mockUser = {
  surName: 'surName',
  alias: 'alias',
  displayName: 'displayName',
  email: 'gmail88@email.com',
  givenName: 'givenName',
  key: 'key'
};

const mockDBUser = {
  _id: 'kas2344nlkla',
  ...mockUser,
  lean: () => this,
  skip: () => this,
  limit: () => this
};

const mockDatasetProperties = [
  {
    attribute: 'http://materialsmine.org/ns/RealPermittivity',
    label: 'Real Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealRelativePermittivity',
    label: 'Real Relative Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/DielectricRealPermittivity',
    label: 'Dielectric Real Permittivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealImpedance',
    label: 'Real Impedance'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealPartOfConductivity',
    label: 'Real part of Conductivity'
  },
  {
    attribute: 'http://materialsmine.org/ns/RealPartOfPermittivity',
    label: 'Real part of Permittivity'
  }
];

const fetchedDatasetProperties = {
  select: (properties) => mockDatasetProperties
};

const mockDeployment = {
  count: 15,
  next: 'https://hub.docker.com/v2/namespaces/dukematsci/repositories/prod-app/tags/?page=2&page_size=10',
  previous: null,
  results: [
    {
      creator: 15551649,
      id: 402281645,
      images: [
        {
          architecture: 'amd64',
          features: '',
          variant: null,
          digest:
            'sha256:2c82b6fdb7eb24ca4e15727f4c6ca77b4b9fb3542e5ba5f347e6237a78f2636b',
          os: 'linux',
          os_features: '',
          os_version: null,
          size: 95095119,
          status: 'active',
          last_pulled: '2024-05-21T18:05:32.445097Z',
          last_pushed: '2024-05-21T18:05:30.837319Z'
        },
        {
          architecture: 'unknown',
          features: '',
          variant: null,
          digest:
            'sha256:092d0716d9d0dcf86029a438827e0070080086fc264fe140fee519b04d25ad1a',
          os: 'unknown',
          os_features: '',
          os_version: null,
          size: 1472,
          status: 'active',
          last_pulled: '2024-05-21T18:05:32.528441Z',
          last_pushed: '2024-05-21T18:05:31.169086Z'
        }
      ],
      last_updated: '2024-05-21T18:05:32.852009Z',
      last_updater: 15551649,
      last_updater_username: 'dukematsci',
      name: 'latest',
      repository: 19451481,
      full_size: 95095119,
      v2: true,
      tag_status: 'active',
      tag_last_pulled: '2024-05-21T18:07:30.626647Z',
      tag_last_pushed: '2024-05-21T18:05:32.852009Z',
      media_type: 'application/vnd.oci.image.index.v1+json',
      content_type: 'image',
      digest:
        'sha256:4a780299b2618050417000e84992ef14991c87c2ee659eda53c9e49f1b98cc05'
    }
  ]
};

module.exports = {
  mockUser,
  mockDBUser,
  fetchedDatasetProperties,
  mockDatasetProperties,
  mockDeployment
};
