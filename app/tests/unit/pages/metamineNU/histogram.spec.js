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
    const layout = wrapper.findComponent('visualizationlayout-stub')
    expect(layout.exists()).toBe(true)
    expect(layout.findComponent('histogram-stub').exists()).toBe(true)
    expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
    expect(layout.findComponent('rangeselector-stub').exists()).toBe(true)
    expect(layout.findComponent('materialinformation-stub').exists()).toBe(
      true
    )
    expect(layout.findComponent('datainfo-stub').exists()).toBe(true)
  })
})
