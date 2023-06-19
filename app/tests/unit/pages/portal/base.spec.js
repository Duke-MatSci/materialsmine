import createWrapper from '../../../jest/script/wrapper'
import PortalBase from '@/pages/portal/Base.vue'

describe('Portal Base.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(PortalBase, {}, false)
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(wrapper.findComponent('md-app-stub').exists()).toBeTruthy()
  })

  it('mounts toolbar component', () => {
    const toolbar = wrapper.findComponent('md-app-toolbar-stub')
    expect(toolbar.attributes().id).toBe('header')
  })

  it('mounts primary drawer component', () => {
    expect(wrapper.findComponent('md-app-drawer-stub').exists()).toBeTruthy()
    expect(wrapper.findComponent('mddrawer-stub').attributes().id).toBe('leftdrawer')
  })

  it('renders main content components', () => {
    const content = wrapper.findComponent('md-app-content-stub')
    expect(content.attributes().class).toBe('viz-u-postion__rel')
    expect(content.findComponent('profile-header-stub').exists()).toBeTruthy()
    expect(content.findComponent('md-app-drawer-stub').exists()).toBeTruthy()
    expect(content.findComponent('md-side-nav-stub').exists()).toBeTruthy()
    expect(content.findComponent('router-view-stub').exists()).toBeTruthy()
  })

  it('renders layout', () => {
    expect(wrapper.find('.viz-u-postion__rel > .md-layout > .md-layout-item').exists()).toBe(true)
    expect(wrapper.find('.md-layout-item > .md-layout-row > .md-content').exists()).toBe(true)
  })

  // @Todo class Assertion and title assertion
})
