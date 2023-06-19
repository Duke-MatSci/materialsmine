import createWrapper from '../../jest/script/wrapper'
import TextEditor from '@/components/TextEditor.vue'

describe('TextEditor', () => {
  let wrapper

  beforeEach(async () => {
    wrapper = await createWrapper(TextEditor, { }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('mounted correctly', () => {
    expect.assertions(3)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.contact_text-editor > .md-layout.md-alignment-center-right').exists()).toBe(true)
    expect(wrapper.find('.contact_text-editor > .editor').exists()).toBe(true)
  })

  it('confirms props', async () => {
    expect.assertions(2)
    const testProps = {
      contentEditable: false
    }
    await wrapper.setProps({ ...testProps })
    expect(wrapper.props('contentEditable')).toBe(testProps.contentEditable)
    expect(wrapper.find('.editor').attributes().contenteditable).toBe(`${testProps.contentEditable}`)
  })

  it('renders all buttons correctly', () => {
    expect.assertions(1)
    expect(wrapper.findAll('.md-layout > .md-button.md-dense.md-icon-button').length).toBe(7)
  })
})
