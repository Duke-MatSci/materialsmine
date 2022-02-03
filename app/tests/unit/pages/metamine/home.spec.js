
import VueMaterial from 'vue-material'
import { enableAutoDestroy, shallowMount, createLocalVue } from '@vue/test-utils'
import Home from '@/pages/metamine/Home.vue'
import router from '@/router/index.js'

describe('Metamine Home page', () => {
  let wrapper
  beforeEach(async () => {
    const localVue = await createLocalVue()
    localVue.use(VueMaterial)
    wrapper = shallowMount(Home, {
      localVue,
      router
    })
  })

  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    expect(wrapper.find('.metamine_intro-header').text()).toBe('MetaMine')
    expect(wrapper.find('.metamine_intro-span').text()).toBe('Material Informatics for MetaMaterials')
    expect(wrapper.findAll('.card').length).toEqual(4)
  })

  it('run the openLink method', async () => {
    const link = wrapper.find('.card')
    await link.trigger('click')
    expect(wrapper.vm.$route.path).toEqual('/explorer')
  })
})