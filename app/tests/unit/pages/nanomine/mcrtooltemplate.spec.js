import createWrapper from '../../../jest/script/wrapper'
import MCRToolTemplate from '@/pages/nanomine/tools/MCRToolTemplate/MCRToolTemplate.vue'

var wrapper = null

const mcrToolTemplateProps = {
  name: 'TestToolName',
  header: 'TestToolHeader',
  referenceList: [],
  card: false,
  job: {} // TODO implement test job once job API is working
}

describe('MCRToolTemplate.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(MCRToolTemplate, {
      props: mcrToolTemplateProps,
      mocks: {
        $socket: { emit: jest.fn() }
      },
      slots: {
        title: 'Title',
        content: 'Content',
        actions: 'Actions',
        description: 'Description',
        'input-options': 'Input Options',
        results: 'Results',
        'submit-button': 'Submit Button'
      },
      // needed to suppress error that MdPortal throws in its beforeDestroy()
      stubs: {
        MdPortal: { template: '<div><slot/></div>' }
      }
    })
  })
  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('fills page slots', () => {
    expect(wrapper.html()).toContain('Description')
    expect(wrapper.html()).toContain('Results')
  })

  it('loads a card', async () => {
    wrapper.setProps({ card: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tool-card').exists()).toBeTruthy()
    expect(wrapper.html()).toContain('Content')
    expect(wrapper.html()).not.toContain('Description')
  })

  // TODO write tests for job API?
})
