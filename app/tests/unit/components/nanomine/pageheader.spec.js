import { mount } from '@vue/test-utils'
import PageHeader from '@/components/nanomine/PageHeader.vue'

const factory = (isAuthenticated = false, info = {}) => {
  return mount(PageHeader, {
    mocks: {
      $store: {
        getters: {
          isAuthenticated
        }
      }
    },
    stubs: ['router-link', 'router-view'],
    propsData: { info }
  })
}

describe('PageHeader.vue', () => {
  it('renders title from passed prop', () => {
    const info = {
      name: 'Test page',
      pagetype: 'test',
      icon: 'description'
    }
    const wrapper = factory(false, info)
    const title = wrapper.findComponent('.u_adjust-banner-text')
    expect(title.text()).toEqual(info.name)
  })

  it('shows logout button when authenticated', () => {
    const wrapper = factory(true)
    const navbar = wrapper.findComponent('.header_nav')
    expect(navbar.text()).toContain('Logout')
  })

  it('shows login button when not authenticated', () => {
    const wrapper = factory(false)
    const navbar = wrapper.findComponent('.header_nav')
    expect(navbar.text()).toContain('Login/Register')
  })
})
