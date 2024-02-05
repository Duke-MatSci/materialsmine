import createWrapper from '../../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ChartVisualizer from '@/components/explorer/dynamfit/ChartVisualizer.vue'

describe('ChartSetting.vue', () => {
  let wrapper
  beforeEach(async () => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = await createWrapper(ChartVisualizer, {}, false)
  })

  enableAutoDestroy(afterEach)

  it('renders layout', () => {
    const template = wrapper.find(
      'div.u_width--max.utility-bg_border-dark.u--b-rad'
    )
    expect(template.exists()).toBe(true)
    expect(template.findAllComponents('md-tabs-stub').length).toBe(1)
  })

  describe('ChartSetting.vue tabs', () => {
    let tabsWrapper
    beforeEach(async () => {
      tabsWrapper = wrapper.findComponent('md-tabs-stub')
    })

    it('renders tabs with custom class', () => {
      expect(tabsWrapper.attributes('class')).toBe(
        'form__stepper form__stepper-curate dialog-box_content'
      )
    })

    it('renders the correct number of tabs', () => {
      expect(tabsWrapper.findAllComponents('md-tab-stub').length).toBe(6)
    })

    it('renders the tabs accordingly', () => {
      const tabs = tabsWrapper.findAllComponents('md-tab-stub')
      expect(tabs.at(0).attributes('mdlabel')).toBe('Complex, E*(iω)')
      expect(tabs.at(0).findComponent('plotlyview-stub').exists()).toBe(true)
      expect(tabs.at(1).attributes('mdlabel')).toBe("E'(ω), tan(δ)")
      expect(tabs.at(1).findComponent('plotlyview-stub').exists()).toBe(true)
      expect(tabs.at(2).attributes('mdlabel')).toBe('Relaxation, E(t)')
      expect(tabs.at(2).findComponent('plotlyview-stub').exists()).toBe(true)
      expect(tabs.at(3).attributes('mdlabel')).toBe('R Spectrum, H(t)')
      expect(tabs.at(3).findComponent('plotlyview-stub').exists()).toBe(true)
      expect(tabs.at(4).attributes('mdlabel')).toBe('Uploaded Data')
      expect(tabs.at(4).findComponent('tablecomponent-stub').exists()).toBe(
        true
      )
      expect(tabs.at(5).attributes('mdlabel')).toBe('Prony Coeff')
      expect(tabs.at(5).findComponent('tablecomponent-stub').exists()).toBe(
        true
      )
    })
  })
})
