import createWrapper from '../../../jest/script/wrapper'
import ModuleTools from '@/pages/nanomine/tools/module/ModuleTools.vue'

var wrapper = null
global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

describe('ModuleTools.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ModuleTools, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays a tool, if provided', () => {
    if (wrapper.vm.$store.getters.moduleTools.length >= 1) {
      expect(wrapper.text()).toMatch(new RegExp(wrapper.vm.$store.getters.moduleTools[0].title))
    }
  })
})
