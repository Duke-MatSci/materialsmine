import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Histogram from '@/pages/metamine/visualizationNU/HistogramPlot.vue'

describe('HistogramPlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Histogram, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    expect(wrapper.findComponent('.histogram-chart').exists()).toBe(true)
    expect(wrapper.findComponent('.subcharts').exists()).toBe(true)
    expect(wrapper.findComponent('.side-tools').exists()).toBe(true)
  })
})
