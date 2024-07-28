import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import HeroHeader from '@/components/nanomine/HeroHeader.vue'

enableAutoDestroy(afterEach)

describe('Drawer.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(
      HeroHeader,
      {
        stubs: {
          RouterLink: RouterLinkStub
        }
      },
      false
    )
  })

  it('renders title from passed state', async () => {
    const info = {
      name: 'Test page',
      pagetype: 'test',
      icon: 'description'
    }
    await wrapper.vm.$store.commit('setAppHeaderInfo', info)
    const title = wrapper.findComponent('.u_adjust-banner-text')
    expect(title.text()).toEqual(info.name)
  })

  it('renders all banner nav', async () => {
    expect.assertions(5)
    expect(wrapper.find('.nav_menu').exists()).toBe(true)
    expect(wrapper.findAll('.u_margin-right-small').length).toBe(5)
    expect(wrapper.findAll('.nav_menu--container').length).toBe(5)
    expect(wrapper.findAll('.u--default-size.nav_menu--handler').length).toBe(
      5
    )
    expect(wrapper.findAll('.nav_menu--siblings').length).toBe(4)
  })
})
