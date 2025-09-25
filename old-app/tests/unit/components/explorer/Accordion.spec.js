import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Accordion from '@/components/accordion.vue'

describe('Accordion.vue', () => {
  const slots = {
    default: 'Accordion Content'
  }
  const props = {
    title: 'Accordion Title'
  }

  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(Accordion, { slots, props }, true)
  })

  enableAutoDestroy(afterEach)

  it('renders title in accordion toolbar', async () => {
    const title = wrapper.get('.md-title')
    expect(title.text()).toBe(props.title)
  })

  it('toggles content on click', async () => {
    const contentSel = '.accordion-content'
    const bar = wrapper.get('.md-title')
    expect(wrapper.find(contentSel).exists()).toBe(false)
    await bar.trigger('click')
    expect(wrapper.get(contentSel).text()).toBe(slots.default)
    await bar.trigger('click')
    expect(wrapper.find(contentSel).exists()).toBe(false)
  })
})
