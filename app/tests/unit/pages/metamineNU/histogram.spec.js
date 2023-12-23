import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Histogram from '@/pages/metamine/visualizationNU/HistogramPlot.vue'

describe('HistogramPlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Histogram, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    const layout = wrapper.findComponent('visualizationlayout-stub')
    expect(layout.exists()).toBe(true)
    expect(layout.findComponent('histogram-stub').exists()).toBe(true)
    expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
    expect(layout.findComponent('rangeselector-stub').exists()).toBe(true)
    expect(layout.findComponent('materialinformation-stub').exists()).toBe(
      true
    )
    expect(layout.findComponent('datainfo-stub').exists()).toBe(true)
  })

  it('displays dialog on small device screen size and changes data value on window resize', async () => {
    if (global.innerWidth > 650) {
      global.innerWidth = 650
    }
    await global.dispatchEvent(new Event('resize'))
    const layout = wrapper.findComponent('visualizationlayout-stub')

    expect(layout.exists()).toBe(false)
    expect(wrapper.vm.isMiniDevice).toBe(true)
    expect(wrapper.findComponent('dialog-stub').exists()).toBe(true)
    expect(wrapper.findAllComponents('dialog-stub').length).toBe(1)

    // screen size above 651px
    global.innerWidth = 651
    await global.dispatchEvent(new Event('resize'))

    expect(wrapper.vm.windowWidth).toBe(651)
    expect(wrapper.vm.isMiniDevice).toBe(false)
    expect(wrapper.findAllComponents('dialog-stub').length).toBe(0)
  })
})
