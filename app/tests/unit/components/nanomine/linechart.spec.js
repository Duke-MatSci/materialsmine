import createWrapper from '../../../jest/script/wrapper'
import LineChart from '@/components/nanomine/LineChart.vue'

var wrapper = null

describe('LineChart.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(LineChart, {
      props: dataProps
    })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('loads dataset and options props', async () => {
    expect(parseInt(wrapper.find('svg').attributes().width)).toEqual(dataProps.options.width + wrapper.vm.margin.left + wrapper.vm.margin.right)
    expect(wrapper.vm.data).toEqual(dataProps.dataset.data)
  })
})

const dataProps = {
  options: {
    height: 400,
    width: 500
  },
  dataset: {
    xlabel: 'Raman shift (cm-1)',
    ylabel: 'Intensity (a.u.)',
    data: [
      { x: 1259.041794, y: 7461.002069 },
      { x: 1284.455822, y: 7668.678442 },
      { x: 1305.029083, y: 7979.071219 },
      { x: 1315.114014, y: 8255.669292 },
      { x: 1328.748842, y: 8541.484406 },
      { x: 1342.34333, y: 8832.990198 },
      { x: 1357.672426, y: 8538.21589 },
      { x: 1363.118289, y: 8307.301556 },
      { x: 1372.178117, y: 8090.092543 },
      { x: 1375.75807, y: 7955.790364 },
      { x: 1399.424044, y: 7641.96282 },
      { x: 1426.048263, y: 7480.513694 },
      { x: 1452.672483, y: 7418.153012 },
      { x: 1479.296703, y: 7409.353652 },
      { x: 1505.920923, y: 7462.149812 },
      { x: 1531.576989, y: 7629.835006 },
      { x: 1546.099291, y: 7878.422573 },
      { x: 1550.841977, y: 8146.204404 },
      { x: 1558.125275, y: 8580.580345 },
      { x: 1570.061089, y: 9200.405986 },
      { x: 1576.672058, y: 8969.469607 },
      { x: 1587.003774, y: 8519.735716 },
      { x: 1600.315884, y: 8171.387941 },
      { x: 1616.048377, y: 7837.185866 },
      { x: 1625.326514, y: 7572.507389 }
    ]
  }
}
