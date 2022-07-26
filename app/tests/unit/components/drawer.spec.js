import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import Drawer from '@/components/Drawer.vue'

enableAutoDestroy(afterEach)

describe('Drawer.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(Drawer, {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }, false)
  })

  it('renders curate and its children on the drawer', () => {
    expect.assertions(7)
    expect(wrapper.html()).toContain('Home')        
    expect(wrapper.html()).toContain('About')        
    expect(wrapper.html()).toContain('Visualize')        
    expect(wrapper.html()).toContain('Curate')        
    expect(wrapper.html()).toContain('Tools')        
    expect(wrapper.html()).toContain('Log out')        
    expect(wrapper.html()).toContain('Login')        
  })
})
