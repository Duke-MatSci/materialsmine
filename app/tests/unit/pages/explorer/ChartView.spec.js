import VueMaterial from 'vue-material'
import { enableAutoDestroy, shallowMount, createLocalVue, resetAutoDestroyState } from '@vue/test-utils'
import ChartView from '@/components/explorer/ChartView.vue'

describe('ChartView.vue', () => {
  let wrapper
  beforeEach(async () => {
    const localVue = createLocalVue()
    localVue.use(VueMaterial)
    wrapper = shallowMount(ChartView, {
      localVue
    })
  })
  enableAutoDestroy(afterEach)
  afterAll(resetAutoDestroyState)

  const chart = {
    title: 'Test Title',
    description: 'Test chart description'
  }

  it('renders title from chart data', async () => {
    await wrapper.setData({ chart })
    const title = wrapper.findComponent('.md-headline')
    expect(title.text()).toContain('Test Title')
  })
  it('renders description from chart data', async () => {
    await wrapper.setData({ chart })
    expect(wrapper.text()).toContain('Test chart description')
  })
})
