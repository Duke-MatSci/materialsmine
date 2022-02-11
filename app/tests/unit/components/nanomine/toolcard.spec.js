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
  link: '/',
  display: true
}

describe('SimulationTools.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ToolCard, { props: toolProp })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays the provided prop tool', () => {
    expect(wrapper.text()).toMatch(new RegExp(toolProp.title))
  })
})
