import createWrapper from '../../../jest/script/wrapper'
import DynamfitResult from '@/pages/nanomine/tools/dynamfitResult/DynamfitResult.vue'

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
    wrapper = createWrapper(DynamfitResult, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays reference container', () => {
    expect(wrapper.find('.reference-container').exists()).toBeTruthy()
  })

  // TODO write tests for API response logic, once Dynamfit API is in place
})
