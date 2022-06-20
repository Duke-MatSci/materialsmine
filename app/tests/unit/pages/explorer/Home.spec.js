import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ExplorerHome from '@/pages/explorer/Home.vue'

describe('ExplorerHome.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ExplorerHome, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('render search div correctly', () => {
    expect.assertions(4)
    expect(wrapper.find('.section_teams').exists()).toBe(true)
    expect(wrapper.find('.search_box_header').exists()).toBe(true)
    expect(wrapper.find('.form').exists()).toBe(true)
    expect(wrapper.find('.search_box_text').exists()).toBe(true)
  })

  it('render facet div correctly', () => {
    expect.assertions(1)
    expect(wrapper.find('.facet_panel').exists()).toBe(true)
  })

  /** @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   * Test no longer applicable. This rendering is now dependent
   * on if searchEnabled is false in the component.
   */

  // it('renders page navs correctly', async () => {
  //   expect.assertions(1)
  //   await wrapper.setData({
  //     pageNavLinks: [
  //       { icon: 'grid', text: 'test', link: '#' },
  //       { icon: 'grid', text: 'test2' }
  //     ]
  //   })
  //   const length = wrapper.vm.pageNavLinks.length
  //   const navLinks = wrapper.findAllComponents('.teams_container')
  //   expect(navLinks.length).toEqual(length)
  // })

  it('renders footer', () => {
    expect.assertions(2)
    expect(wrapper.find('.explorer_page_footer').exists()).toBe(true)
    expect(wrapper.find('.explorer_page_footer-text').exists()).toBe(true)
  })

  // it('goes to parameterized query page when clicked', () => {
  //   const button = wrapper.find('.p_query')
  //   expect(button.exists()).toBe(true)
  //   button.trigger('click')
  //   expect(wrapper.find('.p_query').exists()).toBe(false)
  //   expect(wrapper.find('.md-title').text()).toBe('Query Template')
  // })
})
