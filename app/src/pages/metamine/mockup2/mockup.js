import VegaLite from '@/components/explorer/VegaLiteWrapper.vue'
import { buildCsvSpec } from '../../../modules/vega-chart'
import embed from 'vega-embed'

export default {
  name: 'Mockup',
  components: {
    VegaLite
  },
  data: () => ({
    spec: null,
    baseSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container',
      hconcat: [
        {
          selection: {
            zoom: {
              type: 'interval',
              bind: 'scales'
            }
          },
          mark: {
            type: 'point',
            stroke: 'black',
            filled: true,
            size: 200
          },
          width: 600,
          height: 400,
          encoding: {
            x: {
              field: 'C11',
              type: 'quantitative',
              title: { signal: 'x_axis' },
              scale: {
                zero: false,
                nice: false,
                padding: 10
              },
              axis: {
                labelAngle: -90
              }
            },
            y: {
              field: 'C12',
              type: 'quantitative',
              title: { signal: 'y_axis' },
              scale: {
                zero: false,
                nice: false,
                padding: 10
              }
            },
            color: {
              field: 'symmetry',
              type: 'nominal',
              title: 'Symmetry'
            },
            tooltip: [
              {
                field: 'symmetry',
                type: 'nominal'
              },
              {
                field: 'C11',
                type: 'quantitative'
              },
              {
                field: 'C12',
                type: 'quantitative'
              },
              {
                field: 'C22',
                type: 'quantitative'
              },
              {
                field: 'C16',
                type: 'quantitative'
              },
              {
                field: 'C26',
                type: 'quantitative'
              },
              {
                field: 'C66',
                type: 'quantitative'
              },
              {
                field: 'CM0',
                type: 'nominal'
              },
              {
                field: 'CM1',
                type: 'nominal'
              }
            ]
          },
          config: {
            view: {
              stroke: 'transparent'
            }
          },
          transform: [
            {
              filter: {
                selection: 'brush_C11'
              }
            },
            {
              filter: {
                selection: 'brush_C12'
              }
            },
            {
              filter: {
                selection: 'brush_C22'
              }
            },
            {
              filter: {
                selection: 'brush_C16'
              }
            },
            {
              filter: {
                selection: 'brush_C26'
              }
            },
            {
              filter: {
                selection: 'brush_C66'
              }
            }
          ]
        },
        {
          vconcat: [
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C11: {
                  type: 'interval',
                  fields: [
                    'C11'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C11',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C11'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C11',
                    type: 'quantitative'
                  }
                ]
              }
            },
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C12: {
                  type: 'interval',
                  fields: [
                    'C12'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C12',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C12'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C12',
                    type: 'quantitative'
                  }
                ]
              }
            },
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C22: {
                  type: 'interval',
                  fields: [
                    'C22'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C22',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C22'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C22',
                    type: 'quantitative'
                  }
                ]
              }
            },
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C16: {
                  type: 'interval',
                  fields: [
                    'C16'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C16',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C16'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C16',
                    type: 'quantitative'
                  }
                ]
              }
            },
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C26: {
                  type: 'interval',
                  fields: [
                    'C26'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C26',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C26'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C26',
                    type: 'quantitative'
                  }
                ]
              }
            },
            {
              mark: {
                type: 'tick'
              },
              selection: {
                brush_C66: {
                  type: 'interval',
                  fields: [
                    'C66'
                  ],
                  encodings: [
                    'x'
                  ],
                  zoom: false,
                  mark: { strokeWidth: 3, stroke: '#000000', fillOpacity: 0 }
                }
              },
              encoding: {
                x: {
                  field: 'C66',
                  type: 'quantitative',
                  scale: {
                    nice: false
                  },
                  title: 'C66'
                },
                color: {
                  field: 'symmetry',
                  type: 'nominal',
                  title: 'Symmetry'
                },
                opacity: {
                  condition: {
                    test: {
                      and: [
                        { selection: 'brush_C11' },
                        { selection: 'brush_C12' },
                        { selection: 'brush_C22' },
                        { selection: 'brush_C16' },
                        { selection: 'brush_C26' },
                        { selection: 'brush_C66' }
                      ]
                    },
                    value: 1
                  },
                  value: 0.2
                },
                tooltip: [
                  {
                    field: 'C66',
                    type: 'quantitative'
                  }
                ]
              }
            }

          ]
        }
      ]
    },
    loading: false,
    results: null,
    xAxis: 'C11',
    yAxis: 'C12',
    patchSpec: {},
    // Doing it this way so we can add more attributes in the future
    // that might have different attr names than labels
    attributes: [
      { attr: 'C11', label: 'C11' },
      { attr: 'C12', label: 'C12' },
      { attr: 'C22', label: 'C22' },
      { attr: 'C16', label: 'C16' },
      { attr: 'C26', label: 'C26' },
      { attr: 'C66', label: 'C66' }
    ]
  }),
  computed: {
    // Limit selection options to avoid graphing the same property against itself
    // Would otherwise cause vega-lite errors
    xAxisOpts () {
      return this.attributes.filter(attr => attr.label !== this.yAxis)
    },
    yAxisOpts () {
      return this.attributes.filter(attr => attr.label !== this.xAxis)
    }
  },
  methods: {
    buildVegaSpec () {
      this.spec = buildCsvSpec(this.baseSpec, this.results)
    },
    async CSVToJSON (delimiter = ',') {
      const requestOptions = {
        headers: {
          accept: 'application/sparql-results+json'
        }
      }
      return await fetch('../metamaterialdata200.csv', requestOptions)
        .then(response => response.text())
        .then(data => {
          const titles = data.slice(0, data.indexOf('\n')).split(delimiter).map(str => str.replace(/^"(.*)"$/, '$1'))
          this.results = data
            .slice(data.indexOf('\n') + 1)
            .split('\n')
            .map(v => {
              const values = v.split(delimiter).map(str => str.replace(/^"(.*)"$/, '$1'))
              return titles.reduce(
                (obj, title, index) => (((obj[title] = values[index]), obj)),
                {}
              )
            })
        })
    },
    alignVegaTooltips () {
      const canvas = document.getElementsByClassName('marks')[0]
      const vegaBindings = document.getElementsByClassName('vega-bindings')[0]
      vegaBindings.style.width = canvas.style.width
    },
    patchVegaSpec () {
      this.loading = false
      return embed('#vegaembed', this.spec,
      // Patch the vega spec to have dynamic properties by using vegaembed
        {
          patch:
      [
        {
          path: '/signals/5',
          op: 'replace',
          value: {
            name: 'zoom',
            update: `{"${this.xAxis}": zoom_${this.xAxis}, "${this.yAxis}": zoom_${this.yAxis}}`
          }
        },
        {
          path: '/signals/6',
          op: 'replace',
          value: {
            name: `zoom_${this.xAxis}`
          }
        },
        {
          path: '/signals/7',
          op: 'replace',
          value: {
            name: `zoom_${this.yAxis}`
          }
        },
        {
          path: '/signals/-',
          op: 'add',
          value: {
            name: 'x_axis',
            value: `${this.xAxis}`
          }
        },
        {
          path: '/signals/-',
          op: 'add',
          value: {
            name: 'y_axis',
            value: `${this.yAxis}`
          }
        },
        {
          path: '/scales/1',
          op: 'replace',
          value: {
            domain: {
              data: 'data_1',
              field: `${this.xAxis}`,
              sort: 'true'
            },
            domainRaw: {
              signal: `zoom["${this.xAxis}"]`
            },
            name: 'concat_0_x',
            nice: false,
            padding: 10,
            range: [
              0,
              { signal: 'concat_0_width' }
            ],
            type: 'linear',
            zero: false
          }
        },
        {
          path: '/scales/2',
          op: 'replace',
          value: {
            domain: {
              data: 'data_1',
              field: `${this.yAxis}`,
              sort: 'true'
            },
            domainRaw: {
              signal: `zoom["${this.yAxis}"]`
            },
            name: 'concat_0_y',
            nice: false,
            padding: 10,
            range: [
              { signal: 'concat_0_height' },
              0
            ],
            type: 'linear',
            zero: false
          }
        },
        {
          path: '/marks/0/marks/0/encode/update/x/field',
          op: 'replace',
          value: `${this.xAxis}`
        },
        {
          path: '/marks/0/marks/0/encode/update/y/field',
          op: 'replace',
          value: `${this.yAxis}`
        },
        {
          path: '/marks/0/signals/0/name',
          op: 'replace',
          value: `zoom_${this.xAxis}`
        },
        {
          path: '/marks/0/signals/1/name',
          op: 'replace',
          value: `zoom_${this.yAxis}`
        },
        {
          path: '/marks/0/signals/2/on/0',
          op: 'replace',
          value: {
            events: [{ signal: `zoom_${this.xAxis} || zoom_${this.yAxis}` }],
            update: `zoom_${this.xAxis} && zoom_${this.yAxis} ? {unit: "concat_0", fields: zoom_tuple_fields, values: [zoom_${this.xAxis},zoom_${this.yAxis}]} : null`
          }
        },
        {
          path: '/marks/0/signals/3/value/0/field',
          op: 'replace',
          value: `${this.xAxis}`
        },
        {
          path: '/marks/0/signals/3/value/1/field',
          op: 'replace',
          value: `${this.yAxis}`
        }
      ]
        })
    }
  },
  created () {
    this.loading = true
    this.CSVToJSON()
      .then(() => this.buildVegaSpec())
      .then(async () => {
        this.patchSpec = await this.patchVegaSpec()
        this.alignVegaTooltips()
      })
  },
  watch: {
    async xAxis () {
      this.patchSpec = await this.patchVegaSpec()
    },
    async yAxis () {
      this.patchSpec = await this.patchVegaSpec()
    }

  }
}
