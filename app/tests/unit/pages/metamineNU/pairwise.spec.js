import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import PairwisePlot from '@/pages/metamine/visualizationNU/PairwisePlot.vue'

describe('PairwisePlot.vue', () => {
  enableAutoDestroy(afterEach)

  describe('PairwisePlot.vue when loadding is true', () => {
    let wrapper
    beforeEach(() => {
      wrapper = createWrapper(PairwisePlot, {}, false)
    })

    it('mount component correctly', () => {
      const layout = wrapper.findComponent('visualizationlayout-stub')
      expect(wrapper.vm.isLoading).toBe(true)
      // main chart component
      expect(wrapper.findComponent('pairwiseplot-stub').exists()).toBe(false)

      // Other components
      expect(layout.findComponent('structure-stub').exists()).toBe(true)
      expect(layout.findComponent('poisson-stub').exists()).toBe(true)
      expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
      expect(layout.findComponent('rangeselector-stub').exists()).toBe(true)
      expect(layout.findComponent('materialinformation-stub').exists()).toBe(
        true
      )
      expect(layout.findComponent('datainfo-stub').exists()).toBe(true)
    })
  })

  describe('PairwisePlot.vue when loadding is false', () => {
    let wrapper
    beforeEach(async () => {
      wrapper = createWrapper(PairwisePlot, {}, false)
      await wrapper.vm.$store.commit('metamineNU/setLoadingState', false)
    })

    afterAll(async () => {
      await wrapper.vm.$store.commit('metamineNU/setLoadingState', true)
    })

    it('mount component and main chart component', () => {
      const layout = wrapper.findComponent('visualizationlayout-stub')
      expect(wrapper.vm.isLoading).toBe(false)
      // main chart
      expect(layout.findComponent('pairwiseplot-stub').exists()).toBe(true)
      // Other component
      expect(layout.findComponent('structure-stub').exists()).toBe(true)
      expect(layout.findComponent('poisson-stub').exists()).toBe(true)
      expect(layout.findComponent('dataselector-stub').exists()).toBe(true)
      expect(layout.findComponent('rangeselector-stub').exists()).toBe(true)
      expect(layout.findComponent('materialinformation-stub').exists()).toBe(
        true
      )
      expect(layout.findComponent('datainfo-stub').exists()).toBe(true)
    })
  })

  describe('PairwisePlot.vue when device screen is small', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper(PairwisePlot, {}, false)
    })

    it('displays visualization component layout on normal screen size', () => {
      if (global.innerWidth < 650) {
        global.innerWidth = 1024
      }
      const layout = wrapper.findComponent('visualizationlayout-stub')

      expect(layout.exists()).toBe(true)
      expect(wrapper.vm.isMiniDevice).toBe(false)
      expect(wrapper.findComponent('dialog-stub').exists()).toBe(false)
    })

    it('displays dialog on small device screen size', async () => {
      if (global.innerWidth > 650) {
        global.innerWidth = 500
      }
      await global.dispatchEvent(new Event('resize'))
      const layout = wrapper.findComponent('visualizationlayout-stub')

      expect(layout.exists()).toBe(false)
      expect(wrapper.vm.isMiniDevice).toBe(true)
      expect(wrapper.findComponent('dialog-stub').exists()).toBe(true)
    })

    it('changes data value on window resize', async () => {
      // resize window
      global.innerWidth = 651
      global.dispatchEvent(new Event('resize'))

      expect(wrapper.vm.windowWidth).toBe(651)
      expect(wrapper.vm.isMiniDevice).toBe(false)

      global.innerWidth = 650
      global.dispatchEvent(new Event('resize'))

      expect(wrapper.vm.windowWidth).toBe(650)
      expect(wrapper.vm.isMiniDevice).toBe(true)
    })
  })
})
