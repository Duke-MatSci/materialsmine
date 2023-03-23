import createWrapper from '../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store/index.js'

// Spy on created method early
const route = jest.spyOn(router, 'push').mockImplementation(() => {})
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
    if (wrapper.vm.$store.getters.countDownDate - new Date().getTime() > 0) {
      expect(route).toHaveBeenCalledWith('/countdown')
    } else {
      expect(dispatch).toHaveBeenCalledWith('auth/tryLogin')
    }
  })
})
