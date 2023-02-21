import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Snackbar from '@/components/Snackbar.vue'

describe('@/components/Snackbar.vue', () => {
  const testMessage = 'Test snack message'
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Snackbar, { }, false)
    wrapper.setData({ show: true })
  })

  enableAutoDestroy(afterEach)

  it('exists', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBe(true)
  })

  // TODO: @Anya determine if we still need this button. Skipping for now
  // It is unusual for snackbar to have close button maybe an action button instead
  it.skip('contains a close button', async () => {
    expect.assertions(4)
    const close = wrapper.find('#snackbarClose')
    expect(close.exists()).toBe(true)
    expect(close.text()).toContain('Close')
    expect(wrapper.vm.show).toBe(true)
    await close.trigger('click')
    expect(wrapper.vm.show).toBe(false)
  })

  it('renders snackbar message from Vuex', async () => {
    expect.assertions(1)
    await wrapper.vm.$store.commit('setSnackbar', {
      message: testMessage
    })
    wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(testMessage)
  })

  it('changes available action when passed from Vuex', async () => {
    expect.assertions(3)
    const mockFn = jest.fn()
    await wrapper.vm.$store.commit('setSnackbar', {
      message: testMessage,
      action: mockFn
    })
    wrapper.vm.$nextTick()
    const action = wrapper.find('#snackbarAction')
    expect(action.exists()).toBe(true)
    expect(action.text()).toContain('Retry')
    await action.trigger('click')
    expect(mockFn).toHaveBeenCalled()
  })
})
