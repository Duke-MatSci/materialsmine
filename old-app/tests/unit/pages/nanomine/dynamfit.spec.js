import createWrapper from '../../../jest/script/wrapper'
import Dynamfit from '@/pages/nanomine/tools/dynamfitTool/Dynamfit.vue'

var wrapper = null

describe('Dynamfit.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(Dynamfit, {
      mocks: {
        $socket: { emit: jest.fn() }
      }
    })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for form logic, once Dynamfit api is in place
})
