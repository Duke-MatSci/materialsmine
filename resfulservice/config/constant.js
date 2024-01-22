module.exports = {
  samples:
    'about?view=instances&uri=http://materialsmine.org/ns/PolymerNanocomposite',
  articles:
    'about?view=instances&uri=http%3A%2F%2Fmaterialsmine.org%2Fns%2FResearchArticle',
  images: 'about?view=instances&uri=http://semanticscience.org/resource/Image',
  charts: 'about?view=instances&uri=http://semanticscience.org/resource/Chart',
  datasets: 'about?view=instances&uri=http://www.w3.org/ns/dcat%23Dataset',
  sparql: 'sparql',
  doiApi: 'https://api.crossref.org/works/',
  doiFields: [
    'publisher',
    'title',
    'author',
    'published',
    'volume',
    'issue',
    'DOI',
    'type',
    'URL',
    'container-title'
  ],
  rorApi: 'https://api.ror.org/organizations',
  rorFields: [
    'id',
    'name',
    'aliases',
    'links',
    'country',
    'addresses'
  ],
  supportedBrowser: [
    'Firefox',
    'Chrome',
    'Canary',
    'Safari',
    'Opera',
    'IE',
    'Edge'
  ],
  userRoles: {
    isAdmin: 'isAdmin',
    member: 'member'
  },
  commentTypes: ['xml', 'charts', 'images'],
  CurationStates: ['Editing', 'Completed'],
  CurationStateDefault: 'Editing',
  CurationEntityStates: ['Approved', 'Not Approved'],
  CurationEntityStateDefault: 'Not Approved',
  DatasetStatusOpt: ['APPROVED', 'UNDER_REVIEW', 'WORK_IN_PROGRESS'],
  // Use for filterings in response
  CurationStateSubstitutionMap: {
    Edit: 'Editing',
    Curated: 'Completed',
    Review: 'Review'
  },
  DatasetStatusDefault: 'WORK_IN_PROGRESS',
  BaseObjectSubstitutionMap: {
    'DATA ORIGIN': 'DATA_SOURCE',
    'MATERIAL TYPES': 'MATERIALS',
    'SYNTHESIS AND PROCESSING': 'PROCESSING',
    'CHARACTERIZATION METHODS': 'CHARACTERIZATION',
    MICROSTRUCTURE: 'MICROSTRUCTURE',
    DMA_Datafile: 'DynamicPropertyProfile'
  },
  ContactPagePurposeOpt: ['QUESTION', 'TICKET', 'SUGGESTION', 'COMMENT'],
  SupportedFileTypes: [
    'png',
    'jpg',
    'jpeg',
    'tiff',
    'tif',
    'csv',
    'zip',
    'xls',
    'xlsx'
  ],
  SupportedFileResponseHeaders: {
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.tiff': 'image/tiff',
    '.tif': 'image/tif',
    '.xls': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.tsv': 'text/tab-separated-values',
    '.npy': 'application/octet-stream'
  },
  colorAssignment: [
    '#FFB347',
    '#8A8BD0',
    '#FFC0CB',
    '#6FA8DC',
    '#8FCE00',
    '#CC0000',
    '#38761D',
    '#9FC5E8',
    '#2f3b45',
    '#e8c29f'
  ],
  MinioBucket: 'mgi',
  MetamineBucket: 'metamine',
  /**  This json object holds placeholder values for all the different types of fields
   *  in the xlsx.json object. This are the values used as placeholders when generating a valid jsonSchema
   *  which is then used to generate a valid XSD.
   */
  XSDJsonPlaceholder: {
    String: 'string',
    File: {
      headers: {
        column: [
          {
            _attributes: {
              id: ''
            },
            _text: ''
          }
        ]
      },
      rows: {
        row: [
          {
            _attributes: {
              id: ''
            },
            column: [
              {
                _attributes: { id: '' },
                _text: ''
              }
            ]
          }
        ]
      }
    },
    varied_multiples: {
      ProcessingMethod: [
        'MeltMixing',
        'SolutionProcessing',
        'In-SituPolymerization',
        'Other_Processing'
      ]
    }
  }
};
