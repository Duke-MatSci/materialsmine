import createWrapper from '../../../jest/script/wrapper'
import Dynamfit from '@/pages/nanomine/tools/dynamfitTool/Dynamfit.vue'

var wrapper = null
global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}
global.fetch = jest.fn()

describe('ChemProps.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(Dynamfit, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays reference container', () => {
    expect(wrapper.find('.reference-container').exists()).toBeTruthy()
  })

  // TODO write tests for form logic, once Dynamfit api is in place
})
