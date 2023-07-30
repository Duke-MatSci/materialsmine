// import createWrapper from '../../../jest/script/wrapper'
// import { enableAutoDestroy } from '@vue/test-utils'
// import PairwisePlot from '@/pages/metamine/visualizationNU/PairwisePlot.vue'

// describe('Metamine Youngs component', () => {
//   let wrapper
//   beforeEach(() => {
//     wrapper = createWrapper(PairwisePlot, {}, true)
//   })
//   enableAutoDestroy(afterEach)

//   it('mount component correctly', () => {
//     const plot = wrapper.findComponent('.js-plotly-plot')
//     expect(plot.exists()).toBe(true)
//   })
// })

import { mount, shallowMount } from '@vue/test-utils'
import PairwisePlotPage from '@/pages/metamine/visualizationNU/PairwisePlotPage.vue'


test('displays message', () => {
  // mount() returns a wrapped Vue component we can interact with
  const wrapper = shallowMount(PairwisePlotPage)

  // Assert the rendered text of the component
  expect(wrapper.classes()).toContain('wrapper-box')
})
