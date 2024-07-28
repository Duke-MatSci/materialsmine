import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import umap from '@/components/metamine/visualizationNU/umap.vue'
import store from '@/store/index.js'

// Somewhere in your test case or test suite

describe('umap', () => {
  enableAutoDestroy(afterEach)

  describe('umap initialization when activeData is empty', () => {
    let wrapper

    const commitSpy = jest.spyOn(store, 'commit')
    const createSvg = jest
      .spyOn(umap.methods, 'createSvg')
      .mockImplementationOnce(() => {})
    const update = jest.spyOn(umap.methods, 'update')

    beforeEach(async () => {
      wrapper = await createWrapper(umap, {}, false)
    })

    afterEach(async () => {
      wrapper.destroy()
      await jest.resetAllMocks()
    })

    it('mounts and sets the page name', () => {
      expect.assertions(3)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ ref: 'umapPlot' }).exists()).toBe(true)
      expect(commitSpy).toHaveBeenCalledWith('metamineNU/setPage', 'umap', {
        root: true
      })
    })

    it('mounts and  calls the method to creates svg but does not update it', () => {
      expect.assertions(6)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findComponent({ ref: 'umapPlot' }).exists()).toBe(true)
      expect(wrapper.vm.container).toEqual(wrapper.vm.$refs.umapPlot)
      expect(createSvg).toHaveBeenCalledTimes(1)
      expect(update).toHaveBeenCalledTimes(0)
      expect(createSvg).toHaveBeenCalledWith({
        container: wrapper.vm.container
      })
    })
  })
})
