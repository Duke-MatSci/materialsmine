import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import UmapPlot from '@/pages/metamine/visualizationNU/UmapPlot.vue'

describe('UmapPlot.vue', () => {
  enableAutoDestroy(afterEach)

  describe('UmapPlot.vue when loading is true', () => {
    let wrapper
    beforeEach(() => {
      wrapper = createWrapper(UmapPlot, {}, false)
    })

    it('mount component correctly and does not display umap if loading is false', () => {
      const layout = wrapper.findComponent('visualizationlayout-stub')
      expect(layout.exists()).toBe(true)
      expect(wrapper.vm.isLoading).toBe(true)
      expect(layout.findComponent('umap-stub').exists()).toBe(false)
      expect(layout.findAllComponents('dialog-box-stub').length).toBe(0)
      // expect five components
      expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
      expect(layout.findComponent('paramselector-stub').exists()).toBe(true)
      expect(layout.findComponent('youngs-stub').exists()).toBe(true)
      expect(layout.findComponent('poisson-stub').exists()).toBe(true)
      expect(layout.findComponent('structure-stub').exists()).toBe(true)
    })
  })

  describe('UmapPlot.vue when loading is false', () => {
    let wrapper
    beforeEach(async () => {
      jest.useFakeTimers()
      wrapper = createWrapper(UmapPlot, {}, false)
      await wrapper.vm.$store.commit('metamineNU/setLoadingState', false)
    })

    it('mount component correctly and does not display umap if showumap is false', () => {
      const layout = wrapper.findComponent('visualizationlayout-stub')
      expect(layout.exists()).toBe(true)
      expect(wrapper.vm.isLoading).toBe(false)
      expect(wrapper.vm.showUmap).toBe(false)
      expect(layout.findComponent('umap-stub').exists()).toBe(false)
      expect(layout.findAllComponents('dialog-box-stub').length).toBe(0)
      // expect five components
      expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
      expect(layout.findComponent('paramselector-stub').exists()).toBe(true)
      expect(layout.findComponent('youngs-stub').exists()).toBe(true)
      expect(layout.findComponent('poisson-stub').exists()).toBe(true)
      expect(layout.findComponent('structure-stub').exists()).toBe(true)
    })

    it('mount component correctly and displays main chart if showUmap is true', async () => {
      const layout = wrapper.findComponent('visualizationlayout-stub')
      expect(layout.exists()).toBe(true)
      expect(wrapper.vm.isLoading).toBe(false)
      await jest.runAllTimers()
      expect(wrapper.vm.showUmap).toBe(true)
      expect(layout.findComponent('umap-stub').exists()).toBe(true)
      expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
      expect(layout.findComponent('paramselector-stub').exists()).toBe(true)
      expect(layout.findComponent('youngs-stub').exists()).toBe(true)
      expect(layout.findComponent('poisson-stub').exists()).toBe(true)
      expect(layout.findComponent('structure-stub').exists()).toBe(true)
      expect(layout.findAllComponents('dialog-box-stub').length).toBe(2)
    })

    it('mounts dialog box correctly', async () => {
      expect.assertions(6)
      await jest.runAllTimers()
      expect(wrapper.vm.showUmap).toBe(true)
      const layout = wrapper.findComponent('visualizationlayout-stub')
      const dialogContainer = layout.find(
        '.tools-simulation.u--layout-flex.u--layout-flex-justify-sb'
      )
      const dialogBox = dialogContainer.findAllComponents('dialog-box-stub')
      const dialogProps = [
        { minwidth: '60', disableclose: 'true' },
        { minwidth: '60', disableclose: 'true' }
      ]
      expect(dialogContainer.exists()).toBe(true)
      for (let i = 0; i < dialogBox.length; i++) {
        const element = dialogBox.at(i)
        expect(element.attributes('minwidth')).toBe(dialogProps[i].minwidth)
        expect(element.attributes('disableclose')).toBe(
          dialogProps[i].disableclose
        )
      }
    })

    it('renders correct number of buttons', async () => {
      expect.assertions(6)
      await jest.runAllTimers()
      expect(wrapper.vm.showUmap).toBe(true)
      const layout = wrapper.findComponent('visualizationlayout-stub')
      const btnContainer = layout.find(
        '.tools-simulation.u--layout-flex.u--layout-flex-justify-sb'
      )
      const button = btnContainer.findAll('button')
      const btnProps = [
        { btnClass: 'nuplot-button button-primary', btnText: 'Save Data' },
        { btnClass: 'nuplot-button button-alert', btnText: 'Reset' }
      ]
      expect(btnProps.length).toBe(2)
      for (let i = 0; i < button.length; i++) {
        const element = button.at(i)
        expect(element.attributes('class')).toBe(btnProps[i].btnClass)
        expect(element.text()).toBe(btnProps[i].btnText)
      }
    })
  })

  describe('UmapPlot.vue when device screen is small', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper(UmapPlot, {}, false)
    })

    it('displays visualization component layout on normal screen size', () => {
      if (global.innerWidth < 650) {
        global.innerWidth = 1024
      }
      const layout = wrapper.findComponent('visualizationlayout-stub')

      expect(layout.exists()).toBe(true)
      expect(wrapper.vm.isMiniDevice).toBe(false)
      expect(wrapper.findComponent('dialog-box-stub').exists()).toBe(false)
    })

    it('displays dialog on small device screen size', async () => {
      if (global.innerWidth > 650) {
        global.innerWidth = 500
      }
      await global.dispatchEvent(new Event('resize'))
      const layout = wrapper.findComponent('visualizationlayout-stub')

      expect(layout.exists()).toBe(false)
      expect(wrapper.vm.isMiniDevice).toBe(true)
      expect(wrapper.findComponent('dialog-box-stub').exists()).toBe(true)
    })

    it('changes data value on window resize', async () => {
      // resize window
      global.innerWidth = 651
      await global.dispatchEvent(new Event('resize'))

      expect(wrapper.vm.windowWidth).toBe(651)
      expect(wrapper.vm.isMiniDevice).toBe(false)

      global.innerWidth = 650
      await global.dispatchEvent(new Event('resize'))

      expect(wrapper.vm.windowWidth).toBe(650)
      expect(wrapper.vm.isMiniDevice).toBe(true)
    })
  })
})
