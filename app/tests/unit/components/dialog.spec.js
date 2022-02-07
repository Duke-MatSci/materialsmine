import VueMaterial from 'vue-material'
import { enableAutoDestroy, createLocalVue, shallowMount } from '@vue/test-utils'
import Dialog from '@/components/Dialog.vue'

describe('@/components/Dialog.vue', () => {
  let wrapper

  beforeEach(async () => {
    const localVue = await createLocalVue()
    localVue.use(VueMaterial)
    wrapper = shallowMount(Dialog, {
      localVue,
      slots: {
        default: ['<p>Testing</p>']
      }
    })
  })

  enableAutoDestroy(afterEach)

  it('check dialog box exist', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('confirms props', async () => {
    const testProps = {
      active: false
    }
    await wrapper.setProps({ ...testProps })
    expect(wrapper.props('active')).toBe(testProps.active)
  })

  it('contains slot', () => {
    const slotExist = wrapper.find('p')
    expect(slotExist.exists()).toBe(true)
    expect(slotExist.text()).toBe('Testing')
  })
})
