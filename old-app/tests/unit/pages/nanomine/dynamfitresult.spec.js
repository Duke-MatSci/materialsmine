import createWrapper from '../../../jest/script/wrapper'
import DynamfitResult from '@/pages/nanomine/tools/dynamfitResult/DynamfitResult.vue'

var wrapper = null

describe('DynamfitResult.vue', () => {
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
