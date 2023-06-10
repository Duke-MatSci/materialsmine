import createWrapper from '../../../jest/script/wrapper'
import SparqlUI from '@/pages/explorer/Sparql.vue'

document.body.createTextRange = (elem) => {
  const textRange = {
    getBoundingClientRect: () => 1,
    getClientRects: () => 1
  }
  return textRange
}

window.focus = jest.fn()
describe('Sparql.vue', () => {
  afterAll(() => {
    window.focus.mockClear()
  })
  it('contains yasgui component', () => {
    const wrapper = createWrapper(SparqlUI, {}, true)
    const yasguiComponent = wrapper.findComponent('.yasgui')
    expect(yasguiComponent.exists()).toBeTruthy()
  })
  it('has a header', () => {
    const wrapper = createWrapper(SparqlUI, { }, true)
    expect(wrapper.text()).toContain('Sparql Query')
  })
})
