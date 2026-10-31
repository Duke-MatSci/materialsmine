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
  rorApi: 'https://api.ror.org/v2/organizations',
  rorFields: ['id', 'names', 'links', 'locations'],
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
  CurationStates: ['Editing', 'Review', 'Completed'],
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
  TaskStatus: ['Awaiting', 'Failed', 'Missing', 'Disabled'],
  TaskStatusDefault: 'Awaiting',
  TaskStatusMap: {
    AWAITING: 'Awaiting',
    FAILED: 'Failed',
    MISSING: 'Missing',
    COMPLETED: 'Completed',
    DISABLED: 'Disabled'
  },
  RunTime: ['Normal', 'Nightly'],
  RunTimeDefault: 'Normal',
  SupportedFileTypes: [
    'png',
    'jpg',
    'jpeg',
    'tiff',
    'tif',
    'tiff',
    'csv',
    'zip',
    'xls',
    'xlsx',
    'tsv',
    'txt',
    'webp'
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
  AdditionalMimeTypes: {
    '.txt': 'text/plain',
    '.webp': 'image/webp',
    '.xml': 'application/xml',
    '.xls': 'application/vnd.ms-excel'
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
  },
  ManagedServiceRegister: {
    chemprops: '/chemprops/call/',
    'tri-ve': '/tri-ve/extract/',
    'fit-shift': '/tri-ve/fit-shift/',
    loadxml: 'loadxml',
    ontology: '/ontology/extract/',
    'validate-ontology': '/ontology/validate/',
    'inference-status': '/ontology/inference/status/',
    'delete-nanopub': '/ontology/nanopub/',
    'yaml-loader': '/yaml_converter/'
  },
  MGD_SVC_ERR_CODE: {
    default: {
      code: 'MM00010',
      description: `This upload has been identified as potentially untrusted. 
            We were unable to verify its origin from the anticipated source`
    }
  },
  SEARCH_FIELD: {
    label: 'label',
    description: 'description'
  },
  DEFAULT_XSD_URL:
    'https://raw.githubusercontent.com/Duke-MatSci/nanomine-schema/refs/heads/master/xml/PNC_schema_031822.xsd',
  MM_BASE: 'http://materialsmine.org/resource/',
  NP_BASE: 'http://materialsmine.org/np/',
  OM2: 'http://www.ontology-of-units-of-measure.org/resource/om-2',
  UNIT_IRI: {
    '%': 'http://www.ontology-of-units-of-measure.org/resource/om-2/percent',
    '1/s':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/reciprocalSecond-Time',
    'a/m^2':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/amperePerSquareMetre',
    c: 'http://www.ontology-of-units-of-measure.org/resource/om-2/coulomb',
    celcius:
      'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsius',
    celsius:
      'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsius',
    '°c':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsius',
    'celsius/min':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsiusPerMinute-Time',
    'celsius/minute':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsiusPerMinute-Time',
    days: 'http://www.ontology-of-units-of-measure.org/resource/om-2/day',
    nm: 'http://www.ontology-of-units-of-measure.org/resource/om-2/nanometre',
    hours: 'http://www.ontology-of-units-of-measure.org/resource/om-2/hour',
    hour: 'http://www.ontology-of-units-of-measure.org/resource/om-2/hour',
    hr: 'http://www.ontology-of-units-of-measure.org/resource/om-2/hour',
    minutes:
      'http://www.ontology-of-units-of-measure.org/resource/om-2/minute-Time',
    minute:
      'http://www.ontology-of-units-of-measure.org/resource/om-2/minute-Time',
    min:
      'http://www.ontology-of-units-of-measure.org/resource/om-2/minute-Time',
    kv: 'http://www.ontology-of-units-of-measure.org/resource/om-2/kilovolt',
    'g/cm^3':
      'http://www.ontology-of-units-of-measure.org/resource/om-2/gramPerCubicCentimetre',
    um: 'http://www.ontology-of-units-of-measure.org/resource/om-2/micrometre',
    hz: 'http://www.ontology-of-units-of-measure.org/resource/om-2/hertz',
    'cm-1': 'http://www.ontology-of-units-of-measure.org/resource/om-2/kayser',
    pa: 'http://www.ontology-of-units-of-measure.org/resource/om-2/pascal'
  },
  FILE_FORMATS: ['file', 'url'],

  OUTPUT_CONTEXT: {
    mm: 'http://materialsmine.org/resource/',
    schema: 'http://schema.org/',
    sio: 'http://semanticscience.org/resource/',
    obo: 'http://purl.obolibrary.org/obo/',
    prov: 'http://www.w3.org/ns/prov#',
    dct: 'http://purl.org/dc/terms/',
    dcat: 'http://www.w3.org/ns/dcat#',
    np: 'http://www.nanopub.org/nschema#',
    unit: 'http://qudt.org/vocab/unit/',
    pav: 'http://purl.org/pav/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    purl: 'http://purl.org/net/provenance/ns#',
    foaf: 'http://xmlns.com/foaf/0.1/',
    skos: 'http://www.w3.org/2004/02/skos/core#'
  },

  SDD_SHEET_NAMES: {
    DICTIONARY: 'Dictionary Mapping',
    CODE_MAPPINGS: 'Code Mappings',
    PREFIXES: 'Prefixes'
  },
  SDD_DICT_COLUMNS: [
    'column',
    'label',
    'comment',
    'definition',
    'attribute',
    'attributeOf',
    'unit',
    'format',
    'time',
    'entity',
    'role',
    'relation',
    'inRelationTo',
    'wasDerivedFrom',
    'wasGeneratedBy',
    'template'
  ],
  SDD_BATCH_SIZE: 500,
  SDD_MATCH_THRESHOLD: 50
};
