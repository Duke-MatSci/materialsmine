import createWrapper from '../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import App from '@/App.vue'
import store from '@/store/index.js'

// Spy on created method early
const dispatch = jest.spyOn(store, 'dispatch').mockImplementation(() => {})

describe('App.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(App, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('mounts properly', () => {
    expect(wrapper.find('.page-container').exists()).toBe(true)
    expect(wrapper.find('#app').exists()).toBe(true)
    expect(dispatch).toHaveBeenCalledWith('auth/tryLogin')
  })
})
