import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import UmapPlot from '@/pages/metamine/visualizationNU/UmapPlot.vue'

describe('UmapPlot.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(UmapPlot, {}, false)
  })
  enableAutoDestroy(afterEach)

  it('mount component correctly', () => {
    const layout = wrapper.findComponent('visualizationlayout-stub')
    expect(layout.exists()).toBe(true)
    expect(layout.findComponent('umap-stub').exists()).toBe(true)
    expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
    expect(layout.findComponent('paramselector-stub').exists()).toBe(true)
    expect(layout.findComponent('youngs-stub').exists()).toBe(true)
    expect(layout.findComponent('poisson-stub').exists()).toBe(true)
    expect(layout.findComponent('structure-stub').exists()).toBe(true)
    expect(layout.findAllComponents('dialog-box-stub').length).toBe(2)
  })

  it('mounts dialog box correctly', () => {
    const layout = wrapper.findComponent('visualizationlayout-stub')
    const dialogContainer = layout.find('.tools-simulation.u--layout-flex.u--layout-flex-justify-sb')
    const dialogBox = dialogContainer.findAllComponents('dialog-box-stub')
    const dialogProps = [
      { minwidth: '60', disableclose: 'true' },
      { minwidth: '60', disableclose: 'true' }
    ]
    expect(dialogContainer.exists()).toBe(true)
    for (let i = 0; i < dialogBox.length; i++) {
      const element = dialogBox.at(i)
      expect(element.attributes('minwidth')).toBe(dialogProps[i].minwidth)
      expect(element.attributes('disableclose')).toBe(dialogProps[i].disableclose)
    }
  })

  it('renders correct number of buttons', () => {
    const layout = wrapper.findComponent('visualizationlayout-stub')
    const btnContainer = layout.find('.tools-simulation.u--layout-flex.u--layout-flex-justify-sb')
    const button = btnContainer.findAll('button')
    const btnProps = [
      { btnClass: 'nuplot-button', btnText: 'Find Nearest Neighbors' },
      { btnClass: 'nuplot-button button-primary', btnText: 'Save Data' },
      { btnClass: 'nuplot-button button-alert', btnText: 'Reset' }
    ]
    expect(btnProps.length).toBe(3)
    for (let i = 0; i < button.length; i++) {
      const element = button.at(i)
      expect(element.attributes('class')).toBe(btnProps[i].btnClass)
      expect(element.text()).toBe(btnProps[i].btnText)
    }
  })
})
