const mockTasks = [
  {
    _id: '65815ebe153d84c75a093d3a',
    serviceName: 'convertImageToPng',
    status: 'Awaiting',
    info: {
      ref: 'mm_files/personal_python_edee-2023-12-19T09:13:17.068Z-001.tif',
      sampleID: '65815ebe153d84c75a093d39'
    },
    createdAt: '2023-12-19T09:13:34.126Z',
    updatedAt: '2023-12-19T13:27:42.005Z'
  }
];

const mockNonExistingService = [
  {
    _id: '65816e1b1dcac5417d995315',
    serviceName: 'compressVideo',
    status: 'Awaiting',
    info: {
      ref: 'mm_files/psychiatric_marmot_marjory-2023-12-19T10:18:47.078Z-001.tif',
      sampleID: '65816e1b1dcac5417d995313'
    },
    createdAt: '2023-12-19T10:19:07.341Z',
    updatedAt: '2023-12-19T10:34:45.894Z'
  }
];

const mockImageConversionInfo = {
  _id: '65815ebe153d84c75a093d3a',
  serviceName: 'convertImageToPng',
  status: 'Awaiting',
  info: {
    ref: 'mm_files/personal_python_edee-2023-12-19T09:13:17.068Z-001.tif',
    sampleID: '65815ebe153d84c75a093d39'
  },
  createdAt: '2023-12-19T09:13:34.126Z',
  updatedAt: '2023-12-19T13:27:42.005Z'
};

const mockKnowledgeRequestInfo = {
  _id: '65815ebe154d84c75a093d3a',
  serviceName: 'knowledgeRequest',
  status: 'Awaiting',
  whenToRun: 'Nightly',
  info: {
    req: {
      env: {
        KNOWLEDGE_ADDRESS: 'http://whyis:8000'
      },
      query: {
        query:
          '\r\nPREFIX sio: <http://semanticscience.org/resource/>\r\nPREFIX mm: <http://materialsmine.org/ns/>\r\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\r\nSELECT DISTINCT ?Sample ?Filler ?VolumeFraction ?Matrix ?ElasticModulus ?UnitOfMeasure WHERE {\n  VALUES (?Filler ?Matrix ?AmountType ?AttributeType) {\n    ("Silicon dioxide" "DGEBA Epoxy Resin" <http://materialsmine.org/ns/VolumeFraction> <http://materialsmine.org/ns/TensileModulus>)\n  }\n\r\n  ?Sample a mm:PolymerNanocomposite ;\r\n          sio:hasComponentPart [ sio:hasRole [ a mm:Filler ] ;\r\n                                 a [ rdfs:label ?Filler ] ;\r\n                                 sio:hasAttribute [ a ?AmountType ;\r\n                                                    sio:hasValue ?VolumeFraction] ] ,\r\n                               [ sio:hasRole [ a mm:Matrix ] ;\r\n                                 a [ rdfs:label ?Matrix ] ] ;\r\n          sio:hasAttribute  ?Attr .\r\n  ?Attr a ?AttributeType ;\r\n     sio:hasValue ?ElasticModulus .\r\n  OPTIONAL { ?Attr sio:hasUnit ?UnitOfMeasure }\r\n}\r\n',
        output: 'json'
      },
      headers: {
        connection: 'upgrade',
        host: 'api',
        'sec-ch-ua':
          '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        accept: 'application/sparql-results+json',
        'sec-ch-ua-mobile': '?1',
        authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWI4ZWM4NWMzZDNiMmVkODJmZTQwMjkiLCJlbWFpbCI6InRlc3R1c2VyQG5vZG9tYWluLm9yZyIsImRpc3BsYXlOYW1lIjoiVGVzdCIsImdpdmVuTmFtZSI6IlRlc3QiLCJzdXJOYW1lIjoiVGVzdCIsImlzQWRtaW4iOnRydWUsInJvbGVzIjoiaXNBZG1pbiIsImlzSW50ZXJuYWwiOnRydWUsImlhdCI6MTcwNzM4MDU0NCwiZXhwIjoxNzA3NDA5MzQ0fQ.oGzv0QGkyjGqcY90t5uFz4xOBPjoGMdfB9AEy3gXYgE',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        referer: 'http://localhost/explorer/parameterized_query',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'if-none-match': 'W/"a5f-Uv9eQj4rUjvHo4d30PI0WF2dIVM"'
      }
    }
  },
  createdAt: '2024-02-08T16:13:46.325Z',
  updatedAt: '2024-02-08T16:13:46.325Z'
};

const mockSparqlResult = {
  head: {
    vars: [
      'uri',
      'downloadUrl',
      'title',
      'description',
      'query',
      'dataset',
      'baseSpec',
      'depiction'
    ]
  },
  results: {
    bindings: [
      {
        uri: {
          type: 'uri',
          value: 'http://nanomine.org/viz/330733156368f4cd'
        },
        title: {
          type: 'literal',
          value: 'MaterialsMine on a Map'
        },
        description: {
          type: 'literal',
          value:
            'This geographic display shows the locations of partner universities developing MaterialsMine with grant funding provided by the NSF CSSI program. The topoJSON map is referenced from the vega-datasets Github repository. Hover over a point to show a tooltip with the university and city!'
        },
        query: {
          type: 'literal',
          value:
            '# This is a placeholder query\nSELECT * WHERE {\n  ?sub a ?obj .\n} \nLIMIT 1'
        },
        baseSpec: {
          type: 'literal',
          value:
            '{"$schema":"https://vega.github.io/schema/vega-lite/v4.json","width":750,"height":500,"projection":{"type":"albersUsa"},"layer":[{"data":{"url":"https://raw.githubusercontent.com/vega/vega-datasets/master/data/us-10m.json","format":{"type":"topojson","feature":"states"}},"mark":{"type":"geoshape","fill":"#ddd","stroke":"#777"}},{"layer":[{"data":{"values":[{"name":"University of Vermont","lat":44.475883,"long":-73.212074,"color":"#00643b","city":"Burlington, VT"},{"name":"Rensselaer Polytechnic Institute","lat":42.72768,"long":-73.691063,"color":"#d6001d","city":"Troy, NY"},{"name":"Duke University","lat":35.994034,"long":-78.898621,"color":"#064ba6","city":"Durham, NC"},{"name":"Northwestern University","lat":42.052158,"long":-87.687866,"color":"#4e2686","city":"Evanston, IL"},{"name":"California Institute of Technology","lat":34.147643,"long":-118.142959,"color":"#f37421","city":"Pasadena, CA"}]},"mark":{"type":"point","filled":true},"selection":{"myhighlight":{"type":"single","on":"mouseover","empty":"none","clear":"mouseout"}},"encoding":{"latitude":{"field":"lat","type":"quantitative"},"longitude":{"field":"long","type":"quantitative"},"color":{"field":"color","type":"nominal","scale":null},"stroke":{"condition":{"selection":"myhighlight","value":"white"},"value":null},"size":{"condition":{"selection":"myhighlight","value":1000},"value":200},"tooltip":[{"field":"name","type":"nominal","title":"University"},{"field":"city","type":"nominal","title":"City"}]}},{"mark":"text"}]}],"config":{"background":"white","view":{"stroke":null}}}'
        },
        depiction: {
          type: 'uri',
          value: 'http://nanomine.org/viz/330733156368f4cd_depiction'
        }
      }
    ]
  }
};

const mockElasticSearchResult = [
  {
    _id: '3kJgiY0B4HSmRyhhSNrO',
    _source: {
      label:
        '\r\nPREFIX sio: <http://semanticscience.org/resource/>\r\nPREFIX mm: <http://materialsmine.org/ns/>\r\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\r\nSELECT DISTINCT ?Sample ?Filler ?VolumeFraction ?Matrix ?ElasticModulus ?UnitOfMeasure WHERE {\n  VALUES (?Filler ?Matrix ?AmountType ?AttributeType) {\n    ("Silicon dioxide" "DGEBA Epoxy Resin" <http://materialsmine.org/ns/VolumeFraction> <http://materialsmine.org/ns/TensileModulus>)\n  }\n\r\n  ?Sample a mm:PolymerNanocomposite ;\r\n          sio:hasComponentPart [ sio:hasRole [ a mm:Filler ] ;\r\n                                 a [ rdfs:label ?Filler ] ;\r\n                                 sio:hasAttribute [ a ?AmountType ;\r\n                                                    sio:hasValue ?VolumeFraction] ] ,\r\n                               [ sio:hasRole [ a mm:Matrix ] ;\r\n                                 a [ rdfs:label ?Matrix ] ] ;\r\n          sio:hasAttribute  ?Attr .\r\n  ?Attr a ?AttributeType ;\r\n     sio:hasValue ?ElasticModulus .\r\n  OPTIONAL { ?Attr sio:hasUnit ?UnitOfMeasure }\r\n}\r\n',
      response: mockSparqlResult,
      date: '2022-12-09'
    }
  }
];

const mockElasticSearchSameDateResult = [
  {
    _source: {
      label:
        '\r\nPREFIX sio: <http://semanticscience.org/resource/>\r\nPREFIX mm: <http://materialsmine.org/ns/>\r\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\r\nSELECT DISTINCT ?Sample ?Filler ?VolumeFraction ?Matrix ?ElasticModulus ?UnitOfMeasure WHERE {\n  VALUES (?Filler ?Matrix ?AmountType ?AttributeType) {\n    ("Silicon dioxide" "DGEBA Epoxy Resin" <http://materialsmine.org/ns/VolumeFraction> <http://materialsmine.org/ns/TensileModulus>)\n  }\n\r\n  ?Sample a mm:PolymerNanocomposite ;\r\n          sio:hasComponentPart [ sio:hasRole [ a mm:Filler ] ;\r\n                                 a [ rdfs:label ?Filler ] ;\r\n                                 sio:hasAttribute [ a ?AmountType ;\r\n                                                    sio:hasValue ?VolumeFraction] ] ,\r\n                               [ sio:hasRole [ a mm:Matrix ] ;\r\n                                 a [ rdfs:label ?Matrix ] ] ;\r\n          sio:hasAttribute  ?Attr .\r\n  ?Attr a ?AttributeType ;\r\n     sio:hasValue ?ElasticModulus .\r\n  OPTIONAL { ?Attr sio:hasUnit ?UnitOfMeasure }\r\n}\r\n',
      response: mockSparqlResult,
      date: new Date().toISOString().slice(0, 10)
    }
  }
];

const fetchedCuration = {
  object: {
    MICROSTRUCTURE: {
      ImageFile: [
        {
          File: '/api/files/psychiatric_marmot_marjory-2023-12-19T10:18:47.078Z-001.tif',
          Description: '40000x magnification',
          MicroscopyType: 'TEM',
          Type: 'grayscale',
          Dimension: {
            Width: {
              unit: 'pixel'
            },
            Height: {
              unit: 'pixel'
            },
            Depth: {
              unit: 'bit'
            }
          }
        }
      ],
      Experimental_Sample_Info: {
        SampleThickness: {
          value: 50,
          unit: 'nm'
        }
      }
    }
  }
};

module.exports = {
  mockTasks,
  mockNonExistingService,
  mockImageConversionInfo,
  mockKnowledgeRequestInfo,
  mockSparqlResult,
  mockElasticSearchResult,
  mockElasticSearchSameDateResult,
  fetchedCuration
};
