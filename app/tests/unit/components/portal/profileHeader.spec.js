import { RouterLinkStub } from '@vue/test-utils'
import createWrapper from '../../../jest/script/wrapper'
import ProfileHeader from '@/components/portal/ProfileHeader.vue'
let wrapper

describe('PageHeader.vue', () => {
  beforeEach(async () => {
    wrapper = createWrapper(ProfileHeader, { }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('mounts properly', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders the proper layout', () => {
    expect(wrapper.find('.u_margin-top-small > .u_display-flex.u--layout-flex-justify-fs > .viz-sample__loading').exists()).toBeTruthy()
    expect(wrapper.find('.u_margin-top-small > .u_display-flex.u--layout-flex-justify-fs > .u--margin-pos').exists()).toBeTruthy()
    expect(wrapper.find('.u_margin-top-small > .u_margin-top-small').exists()).toBeTruthy()
  })

  it('renders avatar container correctly', () => {
    const routerLink = wrapper.findComponent(RouterLinkStub)
    const avatar = routerLink.findComponent('md-avatar-stub')
    expect(routerLink.attributes().class).toBe('viz-sample__loading')
    expect(routerLink.props().to).toEqual({ name: 'PortalHome' })
    expect(avatar.findComponent('md-ripple-stub').exists()).toBeTruthy()
    expect(avatar.attributes().class).toBe('md-avatar-icon md-large md-primary u_margin-none u--bg utility-gridborder')
    expect(avatar.findComponent('md-ripple-stub').attributes().class).toBe('md-title')
  })

  it('renders divider ', () => {
    const divider = wrapper.findComponent('md-divider-stub')
    expect(divider.exists()).toBeTruthy()
    expect(divider.attributes().class).toBe('u_margin-top-small')
  })

  it('renders the proper text', () => {
    const textContainer = wrapper.find('.u--margin-pos')
    const text = textContainer.findAll('p')
    expect(text.length).toBe(2)
    expect(text.at(0).attributes().class).toBe('u--color-primary md-body-1')
    expect(text.at(1).text()).toBe('Your Admin Center')
    expect(text.at(1).attributes().class).toBe('u--color-grey md-caption')
  })
})
