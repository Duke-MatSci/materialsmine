import { mount } from '@vue/test-utils'
import YasrWrapper from '@/components/explorer/yasr.vue'

describe('yasr.vue', () => {
  it('renders yasr in correct place', () => {
    const wrapper = mount(YasrWrapper, {})
    const yasrComponent = wrapper.findComponent('#YASR > .yasr')
    expect(yasrComponent.exists()).toBeTruthy()
  })
  it('renders yasr in correct place with custom id prop', () => {
    const id = 'yasrTest'
    const wrapper = mount(YasrWrapper, {
      propsData: { id }
    })
    const yasrComponent = wrapper.findComponent('#yasrTest > .yasr')
    expect(yasrComponent.exists()).toBeTruthy()
  })
  it('displays results from prop', async () => {
    const wrapper = mount(YasrWrapper, {})
    await wrapper.setProps({ results })
    const yasrTable = wrapper.findComponent('table')
    expect(yasrTable.exists()).toBeTruthy()
    expect(wrapper.text()).toContain('https://www.example.com/1')
  })
})

const results = {
  head: {
    vars: [
      'a'
    ]
  },
  results: {
    bindings: [
      {
        a: {
          type: 'uri',
          value: 'https://www.example.com/1'
        }
      },
      {
        a: {
          type: 'uri',
          value: 'https://www.example.com/2'
        }
      }
    ]
  }
}
