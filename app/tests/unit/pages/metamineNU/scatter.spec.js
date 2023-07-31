import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ScatterPlot from '@/pages/metamine/visualizationNU/ScatterPlot.vue'

describe('ScatterPlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ScatterPlot, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    expect(wrapper.findComponent('.scatter-chart').exists()).toBe(true)
    expect(wrapper.findComponent('.subcharts').exists()).toBe(true)
    expect(wrapper.findComponent('.side-tools').exists()).toBe(true)

  })
})
