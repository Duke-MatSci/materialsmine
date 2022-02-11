import createWrapper from '../../../jest/script/wrapper'
import ChemPropsAPIToken from '@/pages/nanomine/tools/chemProps/chemPropsAPIToken.vue'

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
    wrapper = createWrapper(ChemPropsAPIToken, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for API token logic, once authorization is in place
})
