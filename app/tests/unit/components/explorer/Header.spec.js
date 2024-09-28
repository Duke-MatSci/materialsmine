import createWrapper from '../../../jest/script/wrapper'
import ExpHeader from '@/components/explorer/Header.vue'
import { HEADER_ROUTES } from '@/modules/nav-routes'

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

  describe('Header.vue on the explorer route', () => {
    beforeAll(async () => {
      await wrapper.vm.$router.push({ path: '/explorer/' })
    })

    it('renders correct number of Menu tabs on explorer routr', async () => {
      expect.assertions(1)
      const menuItems = wrapper.findAll('._menutabs')
      expect(menuItems.length).toBe(HEADER_ROUTES.explorer.length)
    })

    it('renders the correct Menu routes and label on explorer routr', async () => {
      const menuItems = wrapper.findAll('._menutabs')
      const ExplorerRoutes = HEADER_ROUTES.explorer

      for (let i = 0; i < menuItems.length; i++) {
        const element = menuItems.at(i)
        expect(element.attributes().to).toEqual(ExplorerRoutes[i].path)
        expect(element.attributes().mdlabel).toEqual(ExplorerRoutes[i].label)
        expect(!!element.attributes().exact).toEqual(ExplorerRoutes[i].exact)
        expect(element.attributes().id).toEqual(
          `tab-${ExplorerRoutes[i]?.name ?? ExplorerRoutes[i]?.label}`
        )
      }
    })
  })

  describe('Header.vue on the ns route', () => {
    beforeAll(async () => {
      await wrapper.vm.$router.push({ path: '/ns/' })
    })

    it('renders correct number of Menu tabs on ns route', async () => {
      expect.assertions(1)
      const menuItems = wrapper.findAll('._menutabs')
      expect(menuItems.length).toBe(HEADER_ROUTES.ns.length)
    })

    it('renders the correct Menu routes and label on ns route', async () => {
      const menuItems = wrapper.findAll('._menutabs')
      const ExplorerRoutes = HEADER_ROUTES.ns

      for (let i = 0; i < menuItems.length; i++) {
        const element = menuItems.at(i)
        expect(element.attributes().to).toEqual(ExplorerRoutes[i].path)
        expect(element.attributes().mdlabel).toEqual(ExplorerRoutes[i].label)
        expect(!!element.attributes().exact).toEqual(ExplorerRoutes[i].exact)
        expect(element.attributes().id).toEqual(
          `tab-${ExplorerRoutes[i]?.name ?? ExplorerRoutes[i]?.label}`
        )
      }
    })
  })

  it('renders Menu tabs only on desktop', async () => {
    expect.assertions(1)
    const toolbar = wrapper.findAll('.md-toolbar-row')
    expect(toolbar.at(1).attributes().class).toContain('u_toggle-display-off')
  })
})
