import createWrapper from '../../../jest/script/wrapper'
import Dynamfit from '@/pages/nanomine/tools/dynamfitTool/Dynamfit.vue'

var wrapper = null

describe('Dynamfit.vue', () => {
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
