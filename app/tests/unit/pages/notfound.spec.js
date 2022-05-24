import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import NotFound from '@/pages/NotFound.vue'

describe('NotFound.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(NotFound, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('render notfound p correctly', () => {
    expect.assertions(1)
    expect(wrapper.find('.page-not-found').exists()).toBe(true)
  })
})
