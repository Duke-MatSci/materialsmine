import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Dialog from '@/components/Dialog.vue'

describe('@/components/Dialog.vue', () => {
  let wrapper
  const slots = {
    title: ['<header>Test Title</header>'],
    content: ['<p>Testing</p>'],
    actions: ['<button>Test Close</button>']
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

  it('contains content slot', () => {
    expect.assertions(2)
    const slotExist = wrapper.find('p')
    expect(slotExist.exists()).toBe(true)
    expect(slotExist.text()).toBe('Testing')
  })

  it('contains title slot', () => {
    expect.assertions(2)
    const slotExist = wrapper.find('header')
    expect(slotExist.exists()).toBe(true)
    expect(slotExist.text()).toBe('Test Title')
  })

  it('contains actions slot', () => {
    expect.assertions(2)
    const slotExist = wrapper.find('button')
    expect(slotExist.exists()).toBe(true)
    expect(slotExist.text()).toBe('Test Close')
  })
})
