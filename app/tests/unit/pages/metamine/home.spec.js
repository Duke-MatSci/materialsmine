import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Home from '@/pages/metamine/Home.vue'

describe('Metamine Home page', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Home, {}, false)
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
