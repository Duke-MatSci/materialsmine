import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Youngs from '@/components/metamine/visualizationNU/youngs.vue'
import Plotly from 'plotly.js'

const newPlotSpy = jest.spyOn(Plotly, 'newPlot').mockImplementation(() => {})
describe('youngs.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(Youngs, {}, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'youngsPlot' }).exists()).toBe(true)
    expect(newPlotSpy).toHaveBeenCalledTimes(1)
    expect(newPlotSpy).toHaveBeenCalledWith(
      wrapper.vm.$refs.youngsPlot,
      [wrapper.vm.trace1],
      wrapper.vm.layout,
      wrapper.vm.config
    )
  })

  it('has the correct initial data propertied ', () => {
    expect(wrapper.vm.layout).toEqual(layout)
    expect(wrapper.vm.config).toEqual(config)
    expect(wrapper.vm.style).toEqual(style)
    expect(wrapper.vm.dataPoint).toEqual(
      wrapper.vm.$store.getters['metamineNU/getDataPoint']
    )
  })

  it('watches the dataPoint for change ', async () => {
    expect(wrapper.vm.dataPoint).toEqual({})
    await wrapper.vm.$store.commit('metamineNU/setDataPoint', { youngs: 55 })
    expect(wrapper.vm.dataPoint).toEqual({ youngs: 55 })
    expect(newPlotSpy).toHaveBeenCalledTimes(2)
  })
})

const layout = {
  title: "Young's Modulus",
  font: {
    family: 'Arial, sans-serif',
    size: 12,
    color: '#000'
  },
  orientation: -90,
  width: 230,
  height: 230,
  margin: {
    b: 40,
    t: 40,
    l: 40,
    r: 40
  },
  polar: {
    radialaxis: {
      visible: true,
      range: [0, 2000000000]
    }
  }
}

const config = {
  modeBarButtonsToRemove: ['zoom2d'],
  responsive: true
}

const style = {
  marginTop: '0px'
}
