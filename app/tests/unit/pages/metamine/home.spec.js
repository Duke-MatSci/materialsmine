import { mount } from '@vue/test-utils'
import Home from '@/pages/metamine/Home.vue'
import router from '@/router/index.js'

const factory = () => {
  return mount(Home, {
    router
  })
}

describe('Nanomine Homepage', () => {
  it('mount component correctly', async () => {
    const wrapper = await factory()
    expect(wrapper.find('.metamine_intro-header').text()).toBe('MetaMine')
    expect(wrapper.find('.metamine_intro-span').text()).toBe('Material Informatics for MetaMaterials')
    expect(wrapper.findAll('.card').length).toEqual(4)
  })

  it('run the openLink method', async () => {
    const wrapper = await factory()
    const link = wrapper.find('.card')
    await link.trigger('click')
    expect(wrapper.vm.$route.path).toEqual('/explorer')
  })
})
