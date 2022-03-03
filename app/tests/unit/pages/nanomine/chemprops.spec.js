import createWrapper from '../../../jest/script/wrapper'
import ChemProps from '@/pages/nanomine/tools/chemProps/ChemProps.vue'

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
    wrapper = createWrapper(ChemProps, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for form logic, once SMILES api is in place
})
