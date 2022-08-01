import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import VisualizationHome from '@/pages/explorer/Visualization.vue'

enableAutoDestroy(afterEach)

describe('Visualization.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(VisualizationHome, {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }, false)
  })

  it('renders visualization page correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page header', () => {
    expect(wrapper.html()).toContain('Gallery Categories')
  })

  it('renders layout items', async () => {
    const layoutItems = wrapper.findAll('.md-layout-item')
    expect(layoutItems.length).toBe(4)
    expect(layoutItems.at(1).is('div')).toBe(true)
  })

  it('routes to chart and image gallery', async () => {
    expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/explorer/chart')
    expect(wrapper.findAllComponents(RouterLinkStub).at(1).props().to).toBe('/explorer/images')
  })
})
