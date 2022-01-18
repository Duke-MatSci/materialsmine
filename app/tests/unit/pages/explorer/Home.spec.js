import VueMaterial from 'vue-material'
import { enableAutoDestroy, shallowMount, createLocalVue, resetAutoDestroyState } from '@vue/test-utils'
import ExplorerHome from '@/pages/explorer/Home.vue'
describe('Header.vue', () => {
  let wrapper
  beforeEach(async () => {
    const localVue = await createLocalVue()
    localVue.use(VueMaterial)
    wrapper = shallowMount(ExplorerHome, {
      localVue
    })
  })
  enableAutoDestroy(afterEach)
  afterAll(resetAutoDestroyState)

  it('render search div correctly', () => {
    expect(wrapper.find('.section_teams').exists()).toBe(true)
    expect(wrapper.find('.search_box_header').exists()).toBe(true)
    expect(wrapper.find('.form').exists()).toBe(true)
    expect(wrapper.find('.search_box_text').exists()).toBe(true)
  })

  it('renders page navs correctly', async () => {
    wrapper.setData({ pageNavLinks: [
        {icon: 'grid', text: 'test'},
        {icon: 'grid', text: 'test2'},
        {icon: 'grid', text: 'test3'}
    ] })
    const length = wrapper.vm.pageNavLinks.length
    const navLinks = wrapper.findAll('.explorer_page-nav-card')
    expect(navLinks.length).toEqual(length)
  })

  it('renders footer', () => {
    expect(wrapper.find('.explorer_page_footer').exists()).toBe(true)
    expect(wrapper.find('.explorer_page_footer-text').exists()).toBe(true)
  })
})
