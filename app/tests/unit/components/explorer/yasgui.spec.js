import createWrapper from '../../../jest/script/wrapper'
import YasguiWrapper from '@/components/explorer/yasgui.vue'

document.body.createTextRange = (elem) => {
  const textRange = {
    getBoundingClientRect: () => 1,
    getClientRects: () => 1
  }
  return textRange
}

describe('yasgui.vue', () => {
  it('renders yasgui in correct place', () => {
    const wrapper = createWrapper(YasguiWrapper, {}, true)
    const yasguiComponent = wrapper.findComponent('#YASGUI > .yasgui')
    expect(yasguiComponent.exists()).toBeTruthy()
  })
  it('renders yasgui in correct place with custom id prop', () => {
    const id = 'yasguiTest'
    const wrapper = createWrapper(YasguiWrapper, { props: { id } }, true)
    const yasguiComponent = wrapper.findComponent('#yasguiTest > .yasgui')
    expect(yasguiComponent.exists()).toBeTruthy()
  })
})
