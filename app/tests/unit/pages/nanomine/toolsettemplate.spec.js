import createWrapper from '../../../jest/script/wrapper'
import ToolSetTemplate from '@/pages/nanomine/toolSets/ToolSetTemplate.vue'

var wrapper = null

const toolSetTemplateProps = {
  pageContent: {
    name: 'ModuleTools',
    title: 'Statistical Learning and Analysis Module Tools',
    text: 'Statistical learning and analysis modules include web and downloadable packages that can be used to pre-process ' +
  'and analyze structure and material property data. Each of the modules will specify the required input format and output data, and provide ' +
  'a brief introduction behind the mechanism of the algorithm.',
    link: 'module_homepage',
    tools: [
      'Dynamfit'
    ],
    toolSets: [
      'MCRTools'
    ]
  }
}

describe('ToolSetTemplate.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolSetTemplate, {
      props: toolSetTemplateProps,
      mocks: {
        $socket: { emit: jest.fn() }
      }
    })
  })
  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays tool cards', async () => {
    expect(wrapper.find('.tool-card').exists()).toBeTruthy()
  })
})
