import { RouterLinkStub } from '@vue/test-utils'
import createWrapper from '../../../jest/script/wrapper'
import SideNav from '@/components/portal/SideNav.vue'

let wrapper
describe('SideNav.vue', () => {
  beforeEach(async () => {
    wrapper = createWrapper(SideNav, { }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('mounts properly', () => {
    expect.assertions(2)
    expect(wrapper.exists()).toBeTruthy()
    expect(wrapper.findComponent('md-list-stub').exists()).toBeTruthy()
  })

  it('renders the proper layout', () => {
    expect(wrapper.findComponent('md-list-stub').attributes().class).toBe('md-dense')
    expect(wrapper.findAll('md-list-stub.md-dense > li.md-list-item').length).toBe(2)
    expect(wrapper.findAll('md-list-stub.md-dense > .u_width--max').length).toBe(wrapper.vm.links.length)
  })

  it('renders Account and deploy classes properly', () => {
    const links = wrapper.findAll('md-list-stub.md-dense > li.md-list-item')
    for (let i = 0; i < links.length; i++) {
      expect(links.at(i).findComponent(RouterLinkStub).attributes().class).toBe('md-list-item-link md-list-item-container md-button-clean')
      expect(links.at(i).find('.md-list-item-link > div.md-list-item-content').exists()).toBeTruthy()
      expect(links.at(i).findAll('.md-list-item-content > i.md-icon').length).toBe(1)
      expect(links.at(i).find('.md-list-item-content > span.md-body-1.u--color-black').exists()).toBeTruthy()
      expect(links.at(i).find('.md-list-item-content.md-list-item-content-reduce.u--layout-flex-justify-fs.md-ripple').exists()).toBeTruthy()
      expect(links.at(i).find('.md-icon.md-icon-font.u--default-size.md-theme-default').exists()).toBeTruthy()
    }
  })

  it('renders Account and deploy links, text and icons', () => {
    const links = wrapper.findAll('md-list-stub.md-dense > li.md-list-item')
    const data = [
      { to: '/portal', icon: 'manage_accounts', text: 'Account' },
      { to: '/portal/deploy', icon: 'settings', text: 'Deploy' }
    ]
    for (let i = 0; i < links.length; i++) {
      expect(links.at(i).findComponent(RouterLinkStub).props().to).toBe(data[i].to)
      expect(links.at(i).find('.md-list-item-content > i.md-icon').text()).toBe(data[i].icon)
      expect(links.at(i).find('.md-icon.md-icon-font.u--default-size.md-theme-default').text()).toBe(data[i].icon)
      expect(links.at(i).find('.md-list-item-content > span.md-body-1.u--color-black').text()).toBe(data[i].text)
    }
  })

  it('renders links from data correctly', () => {
    const linksContainer = wrapper.findAll('.u_width--max')
    const data = wrapper.vm.links
    expect(linksContainer.length).toBe(data.length)
    for (let i = 0; i < linksContainer.length; i++) {
      expect(linksContainer.at(i).find('div.u--font-emph-l.u_margin-top-small > span.md-body-2').text()).toBe(data[i].name)
      expect(linksContainer.at(i).findComponent('md-divider-stub').exists()).toBeTruthy()
      expect(linksContainer.at(i).findAll('.md-list-item').length).toBe(data[i].children.length)
      expect(linksContainer.at(i).find('.md-list-item-link > div.md-list-item-content').exists()).toBeTruthy()
      expect(linksContainer.at(i).findAll('.md-list-item-content > i.md-icon').length).toBe(data[i].children.length)
      expect(linksContainer.at(i).find('.md-list-item-content > span.md-body-1.u--color-black').exists()).toBeTruthy()
      expect(linksContainer.at(i).find('.md-list-item-content.md-list-item-content-reduce.u--layout-flex-justify-fs.md-ripple').exists()).toBeTruthy()
      expect(linksContainer.at(i).find('.md-icon.md-icon-font.u--default-size.md-theme-default').exists()).toBeTruthy()
    }
  })
})
