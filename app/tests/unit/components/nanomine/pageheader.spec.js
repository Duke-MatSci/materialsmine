import { mount } from '@vue/test-utils'
import PageHeader from '@/components/nanomine/PageHeader.vue'

// Using createWrapper will fail this component, as it will not have access to
// Vue-material MdApp needed by md-app-toolbar
const factory = (isAuthenticated = false, info = {}) => {
  return mount(PageHeader, {
    mocks: {
      $store: {
        getters: {
          'auth/isAuthenticated': isAuthenticated,
          'auth/displayName': 'Test',
          appHeaderInfo: info
        }
      }
    },
    stubs: ['router-link', 'router-view']
  })
}

describe('PageHeader.vue', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('shows logout button when authenticated', () => {
    const wrapper = factory(true)
    const navbar = wrapper.findComponent('#authmenu')
    expect(navbar.text()).toContain('Logout')
  })

  it('shows login button when not authenticated', () => {
    const wrapper = factory(false)
    const navbar = wrapper.findComponent('#authmenu')
    expect(navbar.text()).toContain('Login/Register')
  })
})
