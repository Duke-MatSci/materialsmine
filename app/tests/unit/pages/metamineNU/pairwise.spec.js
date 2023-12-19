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
    const layout = wrapper.findComponent('visualizationlayout-stub')
    expect(layout.exists()).toBe(true)
    expect(layout.findComponent('pairwiseplot-stub').exists()).toBe(true)
    expect(layout.findComponent('structure-stub').exists()).toBe(true)
    expect(layout.findComponent('poisson-stub').exists()).toBe(true)
    expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
    expect(layout.findComponent('rangeselector-stub').exists()).toBe(true)
    expect(layout.findComponent('materialinformation-stub').exists()).toBe(
      true
    )
    expect(layout.findComponent('datainfo-stub').exists()).toBe(true)
  })
})
