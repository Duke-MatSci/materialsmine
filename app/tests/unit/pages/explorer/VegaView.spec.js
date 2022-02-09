import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import VegaView from '@/pages/explorer/vega/view/VegaView.vue'
import { getDefaultChart, loadChart } from '@/modules/vega-chart'
jest.mock('@/modules/vega-chart')
getDefaultChart.mockImplementation((uri) => {
  return Object.assign({}, testChart)
})
loadChart.mockImplementation((uri) => {
  return Object.assign({}, testChart)
})

const testChart = {
  uri: null,
  baseSpec: {},
  query: '',
  title: 'Test Title',
  description: 'Test chart description',
  depiction: null
}

describe('VegaView.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(VegaView, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('renders title from chart data', async () => {
    const title = wrapper.findComponent('.md-headline')
    expect(title.text()).toContain('Test Title')
  })
  it('renders description from chart data', async () => {
    expect(wrapper.text()).toContain('Test chart description')
  })
})
