import createWrapper from '../../../jest/script/wrapper'
import ChemPropsAPIToken from '@/pages/nanomine/tools/chemPropsAPIToken/ChemPropsAPIToken.vue'

var wrapper = null

describe('ChemPropsAPIToken.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ChemPropsAPIToken, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for API token logic, once authorization is in place
})
