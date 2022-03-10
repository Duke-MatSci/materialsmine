import createWrapper from '../../../jest/script/wrapper'
import ToolCard from '@/components/nanomine/ToolCard.vue'

var wrapper = null

describe('ToolCard.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolCard, {
      slots: {
        image: 'Image',
        title: 'Title',
        content: 'Content',
        actions: 'Actions'
      }
    }, false)
    // wrapper.vm.$router.push('localhost/nm')
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays the provided prop tool', () => {
    expect(wrapper.text()).toContain('Image')
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.text()).toContain('Actions')
  })
})
