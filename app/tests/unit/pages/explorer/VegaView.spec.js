import createWrapper from '../../../jest/script/wrapper'
import VegaView from '@/pages/explorer/chart/view/VegaView.vue'
import { getDefaultChart, loadChart, buildSparqlSpec } from '@/modules/vega-chart'
import { querySparql } from '@/modules/sparql'
jest.mock('@/modules/vega-chart')
jest.mock('@/modules/sparql')
getDefaultChart.mockImplementation(() => {
  return Object.assign({}, testChart)
})
loadChart.mockImplementation((uri) => {
  return Object.assign({}, testChart)
})
buildSparqlSpec.mockImplementation((baseSpec, sparqlResults) => {
  return Object.assign({}, testChart.baseSpec)
})
querySparql.mockImplementation((uri) => {})

const testChart = {
  baseSpec: {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    mark: 'bar',
    encoding: {
      x: {
        field: 'a',
        type: 'quantitative'
      },
      y: {
        field: 'b',
        type: 'quantitative'
      }
    }
  },
  query: 'Test Query',
  title: 'Test Title',
  description: 'Test chart description'
}

describe('VegaView.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(VegaView, {}, true)
  })

  it('renders title from chart data', async () => {
    const title = await wrapper.findComponent('.md-headline')
    expect(title.text()).toContain('Test Title')
  })

  it('renders description from chart data', () => {
    expect(wrapper.text()).toContain('Test chart description')
  })

  it('renders chart query dialog button', () => {
    expect(wrapper.findComponent('#chartQueryBtn').exists()).toBeTruthy()
  })

  it('renders vega spec dialog button', () => {
    expect(wrapper.findComponent('#vegaSpecBtn').exists()).toBeTruthy()
  })

  it('hides chart data dialog button if no data', () => {
    expect(wrapper.findComponent('#dataTableBtn').exists()).toBeFalsy()
  })

  it('opens share dialog on click', async () => {
    expect.assertions(2)
    const shareButton = await wrapper.findComponent('#shareChartBtn')
    const spy = jest.spyOn(wrapper.vm, 'renderDialog')
    await shareButton.trigger('click')
    expect(spy).toHaveBeenCalled()
    expect(wrapper.findComponent('.dialog-box').exists()).toBeTruthy()
  })
})
