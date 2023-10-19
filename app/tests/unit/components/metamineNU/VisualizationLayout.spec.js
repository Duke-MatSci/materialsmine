import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import VLayour from '@/components/metamine/visualizationNU/VisualizationLayout.vue'

describe('VisualizationLayout.vue', () => {
  let wrapper
  const slots = {
    main_chart: ['<header>Test Title</header>'],
    subcharts: ['<p>Testing</p>'],
    side_tools: ['<button>Test Close</button>']
  }
  const props = {
    link: { to: '/mm', text: 'Pairwise' },
    dense: false
  }
  beforeEach(async () => {
    wrapper = await createWrapper(VLayour, { slots, props }, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('renders layout properly ', () => {
    expect(wrapper.find('div.main.tool_page').exists()).toBe(true)
    expect(wrapper.find('div.main > div.adjust-padding').exists()).toBe(true)
    const mainContent = wrapper.find('div.main > div.adjust-padding')
    expect(mainContent.exists()).toBe(true)

    const mainChart = mainContent.find('div.histogram-chart.md-layout-item.md-size-50.md-small-size-65.md-xsmall-size-100')
    expect(mainChart.exists()).toBe(true)
    expect(mainChart.find('header').text()).toBe('Test Title')
    const subChart = mainContent.find('div.md-layout-item.md-size-20.md-small-size-35.u--layout-flex.u--layout-flex-column.u--layout-flex-justify-fs.u_centralize_items.utility-roverflow')
    expect(subChart.exists()).toBe(true)
    expect(subChart.find('p').text()).toBe('Testing')
    const sideTools = mainContent.find('div.side-tools.md-size-30.md-small-size-100.md-layout-item')
    expect(sideTools.exists()).toBe(true)
    expect(sideTools.find('button').text()).toBe('Test Close')
  })

  it('renders button properly ', () => {
    const button = wrapper.find('div.main > div.adjust-padding > div > button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('class')).toBe('nuplot-button-link')
    expect(button.findComponent(RouterLinkStub).props().to).toBe(props.link.to)
    expect(button.findComponent(RouterLinkStub).text()).toBe(props.link.text)
  })
})
