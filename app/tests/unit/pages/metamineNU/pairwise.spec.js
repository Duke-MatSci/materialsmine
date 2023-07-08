import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import PairwisePlot from '@/pages/metamine/visualizationNU/PairwisePlot.vue'

describe('PairwisePlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(PairwisePlot, {}, true)
  }
  )

  enableAutoDestroy(afterEach)

    it('mount component correctly', () => {
    expect(wrapper.find('.metamine_pairwise-header').text()).toBe('Material Data Explorer (Pairwise)')
    expect(wrapper.find('.pairwise-plot-chart')).toBe(true)
    expect(wrapper.find('.pairwise-plot-subcharts')).toBe(true)
    expect(wrapper.find('.pairwise-plot-side-tools')).toBe(true)
    })

})
