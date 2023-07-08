import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'

describe('Metamine Poisson component', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Poisson, {}, true)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    const plot = wrapper.findComponent('.js-plotly-plot')
    expect(plot.exists()).toBe(true)
  })
})
