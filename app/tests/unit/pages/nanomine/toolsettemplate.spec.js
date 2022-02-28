import createWrapper from '../../../jest/script/wrapper'
import ToolSetTemplate from '@/pages/nanomine/tools/toolSetTemplate/ToolSetTemplate.vue'

var wrapper = null

const toolSetTemplateProps = {
  // must use an actual toolset, as we aren't using a mock store in createWrapper
  // so we can't just pass test state
  toolProp: 'ModuleTools'
}

describe('ToolSetTemplate.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolSetTemplate, {
      props: toolSetTemplateProps
    })
  })
  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('makes a store call for page content', () => {
    expect(wrapper.vm.pageContent).toBeTruthy()
  })

  it('displays tool cards', async () => {
    expect(wrapper.find('.tool-card').exists()).toBeTruthy()
  })

  it('displays reference container', () => {
    expect(wrapper.find('.reference-container').exists()).toBeTruthy()
  })
})
