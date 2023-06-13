import createWrapper from '../../../jest/script/wrapper'
import ExpHeader from '@/components/explorer/Header.vue'
describe('Header.vue', () => {
  let wrapper
  const toggler = jest.fn()
  beforeEach(() => {
    wrapper = createWrapper(ExpHeader, { props: { toggler } }, false)
  })

  it('renders logo correctly', () => {
    expect.assertions(2)
    const srcString = '@/assets/img/materialsmine_logo_sm.png'
    const logo = wrapper.find('#logo')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('src')).toBe(srcString)
  })

  it('triggers toggleMenu', async () => {
    expect.assertions(1)
    const menuBtn = wrapper.find('.md-icon-button')
    expect(menuBtn.exists()).toBe(true)
  })

  it('renders Menu tabs correctly', async () => {
    expect.assertions(1)
    const menuItems = wrapper.findAll('._menutabs')
    expect(menuItems.length).toBe(5)
  })

  it('renders Menu tabs only on desktop', async () => {
    expect.assertions(1)
    const toolbar = wrapper.findAll('.md-toolbar-row')
    expect(toolbar.at(1).attributes().class).toContain('u_toggle-display-off')
  })
})
