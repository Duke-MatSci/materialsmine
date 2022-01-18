import VueMaterial from 'vue-material'
import { enableAutoDestroy, shallowMount, createLocalVue, resetAutoDestroyState } from '@vue/test-utils'
import ExpHeader from '@/components/explorer/Header.vue'
describe('Header.vue', () => {
  let wrapper
  beforeEach(async () => {
    const localVue = await createLocalVue()
    localVue.use(VueMaterial)
    wrapper = shallowMount(ExpHeader, {
      localVue
    })
  })
  enableAutoDestroy(afterEach)
  afterAll(resetAutoDestroyState)

  it('renders logo correctly', () => {
    const srcString = '@/assets/img/materialsmine_logo_sm.png'
    const logo = wrapper.find('#logo')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('src')).toBe(srcString)
  })

  it('triggers toggleMenu', async () => {
    const menuBtn = wrapper.find('.md-icon-button')
    expect(menuBtn.exists()).toBe(true)
  })

  it('renders Menu tabs correctly', async () => {
    const menuItems = wrapper.findAll('.tabs')
    expect(menuItems.length).toBe(3)
  })
})
