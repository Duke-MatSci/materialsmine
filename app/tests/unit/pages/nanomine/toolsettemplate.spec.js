import createWrapper from '../../../jest/script/wrapper'
import ToolSetTemplate from '@/pages/nanomine/toolSets/ToolSetTemplate.vue'

var wrapper = null

const toolSetTemplateProps = {
  name: 'ModuleTools',
  header: 'Tools',
  card: false
}

describe('ToolSetTemplate.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolSetTemplate, {
      props: toolSetTemplateProps,
      mocks: {
        $socket: { emit: jest.fn() }
      },
      slots: {
        title: 'Title',
        content: 'Content',
        cards: '<div class="tool-card-list">Cards</div>'
      },
      stubs: {
        'tool-card': true
      }
    })
  })
  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('fills page slots', () => {
    expect(wrapper.html()).toContain('Title')
    expect(wrapper.html()).toContain('Content')
    expect(wrapper.find('.tool-card-list').exists()).toBeTruthy()
  })

  it('loads a card', async () => {
    wrapper.setProps({ card: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tool-card').exists()).toBeTruthy()
    expect(wrapper.find('.tool-card-list').exists()).toBeFalsy()
  })
})
