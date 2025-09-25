interface VegaLiteSpec {
  $schema: string;
  hconcat: any[];
  [key: string]: any;
}

interface PatchOperation {
  path: string;
  op: string;
  value: any;
}

interface Patch {
  patch: PatchOperation[];
}

const baseSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  hconcat: [
    {
      selection: {
        zoom: {
          type: 'interval',
          bind: 'scales',
        },
        propbrush: { type: 'point', on: 'mouseover', nearest: true },
      },
      mark: {
        type: 'point',
        stroke: 'black',
        filled: true,
        size: 80,
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
            padding: 10,
          },
          axis: {
            labelAngle: -90,
          },
        },
        y: {
          field: 'C12',
          type: 'quantitative',
          title: { signal: 'y_axis' },
          scale: {
            zero: false,
            nice: false,
            padding: 10,
          },
        },
        tooltip: [
          {
            field: 'symmetry',
            type: 'nominal',
            title: 'Symmetry',
          },
          {
            field: 'C11',
            type: 'quantitative',
          },
          {
            field: 'C12',
            type: 'quantitative',
          },
          {
            field: 'C22',
            type: 'quantitative',
          },
          {
            field: 'C16',
            type: 'quantitative',
          },
          {
            field: 'C26',
            type: 'quantitative',
          },
          {
            field: 'C66',
            type: 'quantitative',
          },
          {
            field: 'CM0',
            type: 'nominal',
            title: 'Material 0',
          },
          {
            field: 'CM1',
            type: 'nominal',
            title: 'Material 1',
          },
        ],
      },
      config: {
        view: {
          stroke: 'transparent',
        },
      },
      transform: [
        {
          filter: {
            field: 'C11',
            valid: true,
          },
        },
        {
          filter: {
            field: 'C12',
            valid: true,
          },
        },
      ],
    },
  ],
  data: {
    name: 'data_1',
  },
  signals: [
    {
      name: 'concat_0_width',
      value: 0,
    },
    {
      name: 'concat_0_height',
      value: 0,
    },
    {
      name: 'zoom',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_0' }],
          update: 'zoom_0',
        },
      ],
    },
    {
      name: 'zoom_0',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_0' }],
          update: 'zoom_0',
        },
      ],
    },
    {
      name: 'zoom_1',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_1' }],
          update: 'zoom_1',
        },
      ],
    },
    {
      name: 'zoom_2',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_2' }],
          update: 'zoom_2',
        },
      ],
    },
    {
      name: 'zoom_3',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_3' }],
          update: 'zoom_3',
        },
      ],
    },
    {
      name: 'zoom_4',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_4' }],
          update: 'zoom_4',
        },
      ],
    },
    {
      name: 'zoom_5',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_5' }],
          update: 'zoom_5',
        },
      ],
    },
    {
      name: 'zoom_C11',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C11' }],
          update: 'zoom_C11',
        },
      ],
    },
    {
      name: 'zoom_C12',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C12' }],
          update: 'zoom_C12',
        },
      ],
    },
    {
      name: 'zoom_C22',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C22' }],
          update: 'zoom_C22',
        },
      ],
    },
    {
      name: 'zoom_C16',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C16' }],
          update: 'zoom_C16',
        },
      ],
    },
    {
      name: 'zoom_C26',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C26' }],
          update: 'zoom_C26',
        },
      ],
    },
    {
      name: 'zoom_C66',
      value: {},
      on: [
        {
          events: [{ signal: 'zoom_C66' }],
          update: 'zoom_C66',
        },
      ],
    },
    {
      name: 'zoom_tuple_fields',
      value: ['C11', 'C12'],
    },
  ],
  scales: [
    {
      domain: {
        data: 'data_1',
        field: 'C11',
        sort: true,
      },
      domainRaw: {
        signal: 'zoom["C11"]',
      },
      name: 'concat_0_x',
      nice: false,
      padding: 10,
      range: [0, { signal: 'concat_0_width' }],
      type: 'linear',
      zero: false,
    },
    {
      domain: {
        data: 'data_1',
        field: 'C12',
        sort: true,
      },
      domainRaw: {
        signal: 'zoom["C12"]',
      },
      name: 'concat_0_y',
      nice: false,
      padding: 10,
      range: [{ signal: 'concat_0_height' }, 0],
      type: 'linear',
      zero: false,
    },
  ],
  axes: [
    {
      domain: false,
      grid: true,
      labelAngle: -90,
      labelFlush: true,
      labelOverlap: true,
      orient: 'bottom',
      scale: 'concat_0_x',
      title: { signal: 'x_axis' },
      titleAlign: 'center',
      titleAnchor: 'middle',
      titleBaseline: 'top',
      titleColor: '#333333',
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleLimit: 0,
      titleOpacity: 1,
      titlePadding: 4,
      titleX: 0,
      titleY: -8,
    },
    {
      domain: false,
      grid: true,
      labelFlush: true,
      labelOverlap: true,
      orient: 'left',
      scale: 'concat_0_y',
      title: { signal: 'y_axis' },
      titleAlign: 'center',
      titleAnchor: 'middle',
      titleBaseline: 'bottom',
      titleColor: '#333333',
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleLimit: 0,
      titleOpacity: 1,
      titlePadding: 4,
      titleX: -8,
      titleY: 0,
    },
  ],
  marks: [
    {
      name: 'concat_0_group',
      type: 'group',
      from: {
        data: 'data_1',
      },
      signals: [
        {
          name: 'zoom_C11',
          value: {},
          on: [
            {
              events: [{ signal: 'zoom_C11' }],
              update: 'zoom_C11',
            },
          ],
        },
        {
          name: 'zoom_C12',
          value: {},
          on: [
            {
              events: [{ signal: 'zoom_C12' }],
              update: 'zoom_C12',
            },
          ],
        },
        {
          name: 'zoom_tuple',
          on: [
            {
              events: [{ signal: 'zoom_C11 || zoom_C12' }],
              update:
                'zoom_C11 && zoom_C12 ? {unit: "concat_0", fields: zoom_tuple_fields, values: [zoom_C11,zoom_C12]} : null',
            },
          ],
        },
        {
          name: 'zoom_tuple_fields',
          value: ['C11', 'C12'],
        },
      ],
      marks: [
        {
          name: 'concat_0_marks',
          type: 'symbol',
          style: ['point'],
          from: {
            data: 'data_1',
          },
          encode: {
            update: {
              ariaRoleDescription: { value: 'point' },
              description: {
                signal:
                  '"Point " + (datum.symmetry ? datum.symmetry : "") + ": " + (format(datum["C11"], "")) + ", " + (format(datum["C12"], ""))',
              },
              fill: { value: '#4c78a8' },
              fillOpacity: { value: 0.7 },
              height: { value: 80 },
              stroke: { value: 'black' },
              strokeWidth: { value: 0.5 },
              width: { value: 80 },
              x: { scale: 'concat_0_x', field: 'C11' },
              y: { scale: 'concat_0_y', field: 'C12' },
            },
            hover: {
              fill: { value: '#4c78a8' },
              fillOpacity: { value: 1 },
              stroke: { value: 'black' },
              strokeWidth: { value: 1 },
            },
          },
        },
      ],
    },
  ],
};

function createPatch(xAxis: string, yAxis: string) {
  return {
    patch: [
      {
        path: '/signals/9',
        op: 'replace',
        value: {
          name: 'zoom',
          update: `{"${xAxis}": zoom_${xAxis}, "${yAxis}": zoom_${yAxis}}`,
        },
      },
      {
        path: '/signals/10',
        op: 'replace',
        value: {
          name: `zoom_${xAxis}`,
        },
      },
      {
        path: '/signals/11',
        op: 'replace',
        value: {
          name: `zoom_${yAxis}`,
        },
      },
      {
        path: '/signals/-',
        op: 'add',
        value: {
          name: 'x_axis',
          value: `${xAxis}`,
        },
      },
      {
        path: '/signals/-',
        op: 'add',
        value: {
          name: 'y_axis',
          value: `${yAxis}`,
        },
      },
      {
        path: '/scales/0',
        op: 'replace',
        value: {
          domain: {
            data: 'data_1',
            field: `${xAxis}`,
            sort: 'true',
          },
          domainRaw: {
            signal: `zoom["${xAxis}"]`,
          },
          name: 'concat_0_x',
          nice: false,
          padding: 10,
          range: [0, { signal: 'concat_0_width' }],
          type: 'linear',
          zero: false,
        },
      },
      {
        path: '/scales/1',
        op: 'replace',
        value: {
          domain: {
            data: 'data_1',
            field: `${yAxis}`,
            sort: 'true',
          },
          domainRaw: {
            signal: `zoom["${yAxis}"]`,
          },
          name: 'concat_0_y',
          nice: false,
          padding: 10,
          range: [{ signal: 'concat_0_height' }, 0],
          type: 'linear',
          zero: false,
        },
      },
      {
        path: '/marks/0/marks/0/encode/update/x/field',
        op: 'replace',
        value: `${xAxis}`,
      },
      {
        path: '/marks/0/marks/0/encode/update/y/field',
        op: 'replace',
        value: `${yAxis}`,
      },
      {
        path: '/marks/0/signals/0/name',
        op: 'replace',
        value: `zoom_${xAxis}`,
      },
      {
        path: '/marks/0/signals/1/name',
        op: 'replace',
        value: `zoom_${yAxis}`,
      },
      {
        path: '/marks/0/signals/2/on/0',
        op: 'replace',
        value: {
          events: [{ signal: `zoom_${xAxis} || zoom_${yAxis}` }],
          update: `zoom_${xAxis} && zoom_${yAxis} ? {unit: "concat_0", fields: zoom_tuple_fields, values: [zoom_${xAxis},zoom_${yAxis}]} : null`,
        },
      },
      {
        path: '/marks/0/signals/3/value/0/field',
        op: 'replace',
        value: `${xAxis}`,
      },
      {
        path: '/marks/0/signals/3/value/1/field',
        op: 'replace',
        value: `${yAxis}`,
      },
    ],
  };
}

export { baseSpec, createPatch };
export type { VegaLiteSpec, Patch, PatchOperation };
