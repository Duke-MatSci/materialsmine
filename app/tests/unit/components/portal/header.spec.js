import { RouterLinkStub } from '@vue/test-utils'
import createWrapper from '../../../jest/script/wrapper'
import PageHeader from '@/components/portal/Header.vue'
let wrapper

describe('PageHeader.vue', () => {
  beforeEach(async () => {
    wrapper = createWrapper(PageHeader, { }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('mounts properly', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders header container', () => {
    const header = wrapper.findComponent('md-app-toolbar-stub')
    expect(header.exists()).toBeTruthy()
    expect(header.attributes().id).toBe('reset_bg')
    expect(header.attributes().class).toBe('md-dense md-primary')
  })

  it('renders the correct image', () => {
    const image = wrapper.find('img')
    expect(wrapper.find('.header-logo').exists()).toBeTruthy()
    expect(image.exists()).toBeTruthy()
    expect(image.attributes().id).toBe('logo')
    expect(image.attributes().src).toBe('@/assets/img/materialsmine_logo_sm.png')
  })

  it('renders the menu button', () => {
    const button = wrapper.findComponent('md-button-stub')
    const icon = button.findComponent('md-icon-stub')
    expect(button.exists()).toBeTruthy()
    expect(icon.exists()).toBeTruthy()
    expect(icon.text()).toBe('menu')
    expect(button.attributes().class).toBe('md-icon-button')
  })

  it('renders the toolbar links', () => {
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.length).toBe(3)
    expect(links.at(0).props().to).toBe('/')
    expect(links.at(1).props().to).toBe('/nm')
    expect(links.at(2).props().to).toBe('/mm')
  })

  it('renders the login button when not logged in', () => {
    const button = wrapper.find('.btn.btn--tertiary.btn--noradius')
    expect(button.exists()).toBeTruthy()
    expect(button.attributes().href).toBe('/secure')
    expect(button.attributes().id).toBe('authmenu')
    expect(button.text()).toBe('Login/Register')
  })

  it('renders the properlayout', () => {
    const start = wrapper.find('.md-dense > .md-toolbar-row > .md-toolbar-section-start')
    const end = wrapper.find('.md-dense > .md-toolbar-row > .md-toolbar-section-end.header_nav')
    expect(start.exists()).toBeTruthy()
    expect(end.exists()).toBeTruthy()
    expect(wrapper.find('.nav.nav_menu.u--inline').exists()).toBe(true)
    expect(wrapper.find('.md-toolbar-row.viz-u-postion__rel').exists()).toBe(true)
  })
})
