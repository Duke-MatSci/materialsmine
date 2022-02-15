import createWrapper from '../../../jest/script/wrapper'
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
    const wrapper = createWrapper(YasqeWrapper, {}, true)
    const yasqeComponent = wrapper.findComponent('#YASQE > .yasqe')
    expect(yasqeComponent.exists()).toBeTruthy()
  })
  it('renders yasqe in correct place with custom id prop', () => {
    const id = 'yasqeTest'
    const wrapper = createWrapper(YasqeWrapper, { props: { id } }, true)
    const yasqeComponent = wrapper.findComponent('#yasqeTest > .yasqe')
    expect(yasqeComponent.exists()).toBeTruthy()
  })
  it('displays query from prop', async () => {
    const value = `SELECT DISTINCT ?testvariable 
    WHERE {
        ?testvariable a ?item.
    } LIMIT 1`
    const wrapper = createWrapper(YasqeWrapper, { props: { value } }, true)
    expect(wrapper.text()).toContain('?testvariable')
  })
})
