const { MM_BASE } = require('./constant');
// exports.CONTEXT = {
//   mm: MM_BASE,
//   schema: 'http://schema.org/',
//   sio: 'http://semanticscience.org/resource/',
//   prov: 'http://www.w3.org/ns/prov#',
//   dct: 'http://purl.org/dc/terms/',
//   np: 'http://www.nanopub.org/nschema#',
//   unit: 'http://qudt.org/vocab/unit/',
//   rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
//   xsd: 'http://www.w3.org/2001/XMLSchema#',
//   id: '@id',
//   type: '@type',
//   hasAttribute: 'sio:SIO_000008',
//   hasValue: { '@id': 'sio:SIO_000300' },
//   hasUnit: { '@id': 'sio:SIO_000221' },
//   title: 'schema:name',
//   author: { '@id': 'schema:author', '@type': '@id' },
//   doi: 'schema:identifier',
//   sameAs: { '@id': 'schema:sameAs', '@type': '@id' },
//   datePublished: 'schema:datePublished',
//   wasDerivedFrom: { '@id': 'prov:wasDerivedFrom', '@type': '@id' },
//   wasAttributedTo: { '@id': 'prov:wasAttributedTo', '@type': '@id' },
//   created: { '@id': 'dct:created', '@type': 'xsd:dateTime' },
//   creator: { '@id': 'dct:creator', '@type': '@id' },
//   hasAssertion: { '@id': 'np:hasAssertion', '@type': '@id' },
//   hasProvenance: { '@id': 'np:hasProvenance', '@type': '@id' },
//   hasPublicationInfo: { '@id': 'np:hasPublicationInfo', '@type': '@id' }
// };

exports.CONTEXT = {
  mm: MM_BASE,
  schema: 'http://schema.org/',
  sio: 'http://semanticscience.org/resource/',
  prov: 'http://www.w3.org/ns/prov#',
  dct: 'http://purl.org/dc/terms/',
  np: 'http://www.nanopub.org/nschema#',
  unit: 'http://qudt.org/vocab/unit/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',

  id: '@id',
  type: '@type',

  hasAttribute: 'sio:SIO_000008',
  hasValue: { '@id': 'sio:SIO_000300' },
  hasUnit: { '@id': 'sio:SIO_000221', '@type': '@id' },

  // article core aliases
  title: 'schema:name',
  name: 'schema:name',
  author: { '@id': 'schema:author', '@type': '@id' },
  doi: 'schema:identifier',
  sameAs: { '@id': 'schema:sameAs', '@type': '@id' },
  datePublished: { '@id': 'schema:datePublished', '@type': 'xsd:gYear' },

  // ------- optional article fields -------
  language: 'schema:inLanguage', // e.g., "en"
  issue: 'schema:issueNumber', // string/number
  keywords: 'schema:keywords', // array of strings ok
  relatedWorks: { '@id': 'dct:relation', '@type': '@id' }, // list of IRIs (OpenAlex/DOIs)
  versions: 'dct:hasVersion', // array of strings/IRIs
  url: { '@id': 'schema:url', '@type': '@id' }, // canonical landing page
  journal: 'schema:isPartOf', // journal name or IRI
  publisher: 'schema:publisher', // string or org IRI
  primaryLocation: 'mm:primaryLocation', // project-specific object (license, pdf_url, etc.)
  countsByYear: { '@id': 'mm:countsByYear', '@container': '@set' },
  year: { '@id': 'mm:year', '@type': 'xsd:integer' },
  citedByCount: { '@id': 'mm:citedByCount', '@type': 'xsd:integer' },

  wasDerivedFrom: { '@id': 'prov:wasDerivedFrom', '@type': '@id' },
  wasAttributedTo: { '@id': 'prov:wasAttributedTo', '@type': '@id' },
  created: { '@id': 'dct:created', '@type': 'xsd:dateTime' },
  creator: { '@id': 'dct:creator', '@type': '@id' },

  hasAssertion: { '@id': 'np:hasAssertion', '@type': '@id' },
  hasProvenance: { '@id': 'np:hasProvenance', '@type': '@id' },
  hasPublicationInfo: { '@id': 'np:hasPublicationInfo', '@type': '@id' }
};
