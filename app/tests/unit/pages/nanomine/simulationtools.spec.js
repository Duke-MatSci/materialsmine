import createWrapper from '../../../jest/script/wrapper'
import SimulationTools from '@/pages/nanomine/tools/simulation/SimulationTools.vue'

var wrapper = null
global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

describe('SimulationTools.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(SimulationTools, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays a tool, if provided', () => {
    if (wrapper.vm.$store.getters.simulationTools.length >= 1) {
      expect(wrapper.text()).toMatch(new RegExp(wrapper.vm.$store.getters.simulationTools[0].title))
    }
  })
})
