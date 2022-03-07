import createWrapper from '../../../jest/script/wrapper'
import ToolCard from '@/components/nanomine/ToolCard.vue'

var wrapper = null

const toolProp = {
  title: 'PropTitle',
  text: 'PropTest',
  link: 'testLink',
  display: true
}

describe('ToolCard.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolCard, { props: toolProp }, false)
    wrapper.vm.$router.push('localhost/nm')
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays the provided prop tool', () => {
    expect(wrapper.text()).toMatch(new RegExp(toolProp.title))
  })
})
