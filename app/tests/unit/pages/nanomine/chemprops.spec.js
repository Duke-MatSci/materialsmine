import createWrapper from '../../../jest/script/wrapper'
import ChemProps from '@/pages/nanomine/tools/chemProps/ChemProps.vue'

var wrapper = null

describe('ChemProps.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ChemProps, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for form logic, once SMILES api is in place
})
