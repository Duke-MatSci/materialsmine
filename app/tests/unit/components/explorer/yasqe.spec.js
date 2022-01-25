import { mount } from '@vue/test-utils'
import YasqeWrapper from '@/components/explorer/yasqe.vue'

document.body.createTextRange = (elem) => {
  const textRange = {
    getBoundingClientRect: () => 1,
    getClientRects: () => 1
  }
  return textRange
}

describe('yasqe.vue', () => {
  it('renders yasqe in correct place', () => {
    const wrapper = mount(YasqeWrapper, {})
    const yasqeComponent = wrapper.findComponent('#YASQE > .yasqe')
    expect(yasqeComponent.exists()).toBeTruthy()
  })
  it('renders yasqe in correct place with custom id prop', () => {
    const id = 'yasqeTest'
    const wrapper = mount(YasqeWrapper, {
      propsData: { id }
    })
    const yasqeComponent = wrapper.findComponent('#yasqeTest > .yasqe')
    expect(yasqeComponent.exists()).toBeTruthy()
  })
  it('displays query from prop', async () => {
    const value = `SELECT DISTINCT ?testvariable 
    WHERE {
        ?testvariable a ?item.
    } LIMIT 1`
    const wrapper = mount(YasqeWrapper, {
      propsData: {
        value
      }
    })
    expect(wrapper.text()).toContain('?testvariable')
  })
})
