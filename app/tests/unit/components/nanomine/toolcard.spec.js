import createWrapper from '../../../jest/script/wrapper'
import ToolCard from '@/components/nanomine/ToolCard.vue'

var wrapper = null
global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

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
  it('adds internal link properly', () => {
    expect(wrapper.find('router-link-stub').attributes().to).toMatch(toolProp.link)
    // expect().toBeFalsy()
  })
  it('adds external link properly', async () => {
    wrapper.setProps({ externalLink: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('router-link').exists()).toBeFalsy()
    expect(wrapper.find('a').attributes().href).toMatch(toolProp.link)
  })
})
