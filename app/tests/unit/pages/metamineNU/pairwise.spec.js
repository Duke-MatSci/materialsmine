import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import PairwisePlot from '@/pages/metamine/visualizationNU/PairwisePlot.vue'

describe('PairwisePlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(PairwisePlot, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    expect(wrapper.findComponent('.pairwise-plot-chart').exists()).toBe(true)
    expect(wrapper.findComponent('.subcharts').exists()).toBe(true)
    expect(wrapper.findComponent('.side-tools').exists()).toBe(true)
  })
})
