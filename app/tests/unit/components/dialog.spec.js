import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Dialog from '@/components/Dialog.vue'

describe('@/components/Dialog.vue', () => {
  let wrapper
  const slots = {
    default: ['<p>Testing</p>']
  }
  beforeEach(() => {
    wrapper = createWrapper(Dialog, { slots }, false)
  })

  enableAutoDestroy(afterEach)

  it('check dialog box exist', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBe(true)
  })

  it('confirms props', async () => {
    expect.assertions(1)
    const testProps = {
      active: false
    }
    await wrapper.setProps({ ...testProps })
    expect(wrapper.props('active')).toBe(testProps.active)
  })

  it('contains slot', () => {
    expect.assertions(2)
    const slotExist = wrapper.find('p')
    expect(slotExist.exists()).toBe(true)
    expect(slotExist.text()).toBe('Testing')
  })
})
