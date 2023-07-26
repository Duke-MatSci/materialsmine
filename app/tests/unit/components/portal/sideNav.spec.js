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
      expect(linksContainer.at(i).findAll('.md-list-item').length).toBe(3)
      expect(linksContainer.at(i).find('.md-list-item-link > div.md-list-item-content').exists()).toBeTruthy()
      expect(linksContainer.at(i).findAll('.md-list-item-content > i.md-icon').length).toBe(data[i].children.length)
      expect(linksContainer.at(i).find('.md-list-item-content > span.md-body-1.u--color-black').exists()).toBeTruthy()
      expect(linksContainer.at(i).find('.md-list-item-content.md-list-item-content-reduce.u--layout-flex-justify-fs.md-ripple').exists()).toBeTruthy()
      expect(linksContainer.at(i).find('.md-icon.md-icon-font.u--default-size.md-theme-default').exists()).toBeTruthy()
    }
  })

  // mobile footer nav
  it('renders footer nav with the right classes', () => {
    expect.assertions(1)
    expect(wrapper.find('div.footer_content-mobile.u_myprofile--image').exists()).toBeTruthy()
  })

  it('renders the proper layout', () => {
    expect.assertions(1)
    expect(wrapper.find('div.footer_content-mobile > nav.nav_menu > ul.u_centralize_text > li.u_margin-right-small').exists()).toBeTruthy()
  })

  it('renders first link properly ', () => {
    const listContainer = wrapper.find('ul.u_centralize_text')
    const firstLink = listContainer.findAll('li.u_margin-right-small').at(0)
    expect(firstLink.findComponent(RouterLinkStub).props().to).toBe('/portal/deploy')
    expect(firstLink.findComponent(RouterLinkStub).attributes().class).toBe('u--default-size')
    expect(firstLink.findComponent(RouterLinkStub).find('span.u--color-primary').exists()).toBeTruthy()
    expect(firstLink.findComponent(RouterLinkStub).find('span.u--color-primary').text()).toBe('Deploy')
  })

  it('renders dropdown links according to the data property links', () => {
    const links = wrapper.vm.links
    const listContainer = wrapper.find('ul.u_centralize_text')
    const linkList = listContainer.findAll('li.u_margin-right-small')
    expect(linkList.length).toBe(links.length + 1)
    for (let i = 1; i < links.length; i++) {
      expect(linkList.at(i).find('div.nav_menu--container > a.nav_menu--handler > span.u--color-primary').text()).toBe(links[i - 1].name)
      expect(linkList.at(i).find('div.nav_menu--container > a ').attributes().class).toBe('u--default-size nav_menu--handler u--color-primary')
      expect(linkList.at(i).find('div.nav_menu--container > a ').attributes().href).toBe()
      expect(linkList.at(i).find('div.nav_menu--container > div.nav_menu--siblings ').exists()).toBe(true)
      expect(linkList.at(i).findAllComponents(RouterLinkStub).length).toBe(links[i - 1].children.length)
      expect(linkList.at(i).findAllComponents(RouterLinkStub).at(0).attributes().class).toBe('nav_menu--siblings-lists')
      expect(linkList.at(i).findAllComponents(RouterLinkStub).at(0).props().to).toBe(links[i - 1].children[0].link)
      expect(linkList.at(i).findAllComponents(RouterLinkStub).at(0).text()).toBe(links[i - 1].children[0].name)
    }
  })
})
