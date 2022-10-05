const baseSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 'container',
  hconcat: [
    {
      selection: {
        zoom: {
          type: 'interval',
          bind: 'scales'
        },
        propbrush: { type: 'point', on: 'mouseover', nearest: true }
      },
      mark: {
        type: 'point',
        stroke: 'black',
        filled: true,
        size: 80
      },
      width: 550,
      height: 600,
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
        // color: {
        //   field: 'symmetry',
        //   type: 'nominal',
        //   title: 'Symmetry',
        //   legend: {
        //     orient: 'top'
        //   }
        // },
        tooltip: [
          {
            field: 'symmetry',
            type: 'nominal',
            title: 'Symmetry'
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
            type: 'nominal',
            title: 'Material 0'
          },
          {
            field: 'CM1',
            type: 'nominal',
            title: 'Material 1'
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry'
            // },
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
              value: 0.01
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry'
            // },
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
              value: 0.01
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry'
            // },
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
              value: 0.01
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry'
            // },
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
              value: 0.01
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry'
            // },
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
              value: 0.01
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
              mark: { strokeWidth: 1, stroke: '#000000', fillOpacity: 0 }
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
            // color: {
            //   field: 'symmetry',
            //   type: 'nominal',
            //   title: 'Symmetry',
            //   scale: { scheme: 'category10' }

            // },
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
              value: 0.01
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
    },
    {
      vconcat: [
        {
          title: 'Unit cell geometry',
          width: 200,
          transform: [
            {
              filter: { selection: 'propbrush' }
            },
            {
              calculate: "replace(datum.geometry_full,/0/g,'□')", as: 'GS'
            },
            {
              calculate: "replace(datum.GS,/1/g,'■')", as: 'GS0'
            },
            {
              calculate: "regexp('(.{' + datum.unit_cell_x_pixels + '})', 'g')", as: 'regex'
            },
            {
              calculate: "split(replace(datum.GS0,datum.regex,'$1$'), '$')", as: 'GS0'
            }
          ],
          mark: {
            type: 'text',
            fontSize: {
              expr: '300/datum.unit_cell_x_pixels'
            },
            font: 'Courier',
            lineHeight: {
              expr: '176.5/datum.unit_cell_x_pixels'
            },
            dy: { expr: '100/datum.unit_cell_x_pixels + 10' }
          },
          encoding: {
            text: { field: 'GS0', type: 'nominal' }
          }

        },
        {
          title: '□ Constituent Material 0 Properties',
          width: 250,
          transform: [
            {
              filter: { selection: 'propbrush' }
            },
            {
              calculate: "'Type: ' + datum.CM0 + '$C11: ' + datum.CM0_C11 + '$C12: ' + datum.CM0_C12 + '$C22: ' + datum.CM0_C22 + '$C16: ' + datum.CM0_C16 + '$C26: ' + datum.CM0_C26 + '$C66: ' + datum.CM0_C66 + '$'",
              as: 'annotated_CM0'
            },
            {
              calculate: "split(datum.annotated_CM0, '$')", as: 'annotated_CM0'
            }
          ],
          mark: {
            type: 'text',
            align: 'left',
            dx: -100
          },
          encoding: {
            text: { field: 'annotated_CM0', type: 'nominal' }
          }
        },
        {
          title: '■ Constituent Material 1 Properties',
          width: 250,
          transform: [
            {
              filter: { selection: 'propbrush' }
            },
            {
              calculate: "'Type: ' + datum.CM1 + '$C11: ' + datum.CM1_C11 + '$C12: ' + datum.CM1_C12 + '$C22: ' + datum.CM1_C22 + '$C16: ' + datum.CM1_C16 + '$C26: ' + datum.CM1_C26 + '$C66: ' + datum.CM1_C66 + '$'",
              as: 'annotated_CM1'
            },
            {
              calculate: "split(datum.annotated_CM1, '$')", as: 'annotated_CM1'
            }
          ],
          mark: {
            type: 'text',
            align: 'left',
            dx: -100
          },
          encoding: {
            text: { field: 'annotated_CM1', type: 'nominal' }
          }
        }
      ]
    }
  ]
}

function createPatch (xAxis, yAxis) {
  return {
    patch: [
      {
        path: '/signals/9',
        op: 'replace',
        value: {
          name: 'zoom',
          update: `{"${xAxis}": zoom_${xAxis}, "${yAxis}": zoom_${yAxis}}`
        }
      },
      {
        path: '/signals/10',
        op: 'replace',
        value: {
          name: `zoom_${xAxis}`
        }
      },
      {
        path: '/signals/11',
        op: 'replace',
        value: {
          name: `zoom_${yAxis}`
        }
      },
      {
        path: '/signals/-',
        op: 'add',
        value: {
          name: 'x_axis',
          value: `${xAxis}`
        }
      },
      {
        path: '/signals/-',
        op: 'add',
        value: {
          name: 'y_axis',
          value: `${yAxis}`
        }
      },
      {
        path: '/scales/0',
        op: 'replace',
        value: {
          domain: {
            data: 'data_1',
            field: `${xAxis}`,
            sort: 'true'
          },
          domainRaw: {
            signal: `zoom["${xAxis}"]`
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
        path: '/scales/1',
        op: 'replace',
        value: {
          domain: {
            data: 'data_1',
            field: `${yAxis}`,
            sort: 'true'
          },
          domainRaw: {
            signal: `zoom["${yAxis}"]`
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
        value: `${xAxis}`
      },
      {
        path: '/marks/0/marks/0/encode/update/y/field',
        op: 'replace',
        value: `${yAxis}`
      },
      {
        path: '/marks/0/signals/0/name',
        op: 'replace',
        value: `zoom_${xAxis}`
      },
      {
        path: '/marks/0/signals/1/name',
        op: 'replace',
        value: `zoom_${yAxis}`
      },
      {
        path: '/marks/0/signals/2/on/0',
        op: 'replace',
        value: {
          events: [{ signal: `zoom_${xAxis} || zoom_${yAxis}` }],
          update: `zoom_${xAxis} && zoom_${yAxis} ? {unit: "concat_0", fields: zoom_tuple_fields, values: [zoom_${xAxis},zoom_${yAxis}]} : null`
        }
      },
      {
        path: '/marks/0/signals/3/value/0/field',
        op: 'replace',
        value: `${xAxis}`
      },
      {
        path: '/marks/0/signals/3/value/1/field',
        op: 'replace',
        value: `${yAxis}`
      }
    ]
  }
}
export { baseSpec, createPatch }
