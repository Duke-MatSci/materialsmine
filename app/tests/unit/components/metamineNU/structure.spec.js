import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import structure from '@/pages/metamine/visualizationNU/components/structure.vue'

const onMountMethod = jest.spyOn(structure.methods, 'createSvg').mockImplementation(() => {})

describe('structure', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(structure, {}, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'structurePlot' }).exists()).toBe(true)
    expect(onMountMethod).toHaveBeenCalledWith(wrapper.vm.dataPoint)
  })

  it('pixelate returns empty array no data argument', async () => {
    const pixel = await wrapper.vm.pixelate()
    expect(pixel).toEqual([])
  })

  it('pixelate returns the right array', async () => {
    const smallSampleData = ['0', '0', '0', '0', '0']
    const pixel = await wrapper.vm.pixelate(smallSampleData, 'blue')
    expect(pixel.length).toEqual(2500)
    expect(pixel[0].x).toEqual(0)
    expect(pixel[0].y).toEqual(0)
    expect(pixel[0].fill).toEqual('white')
    expect(pixel[0].x).toEqual(0)
    expect(pixel[5].y).toEqual(5)
    expect(pixel[5].fill).toEqual('blue')
  })

  it('calculateRatio returns 0 if no data argument', async () => {
    const calculateRatio = await wrapper.vm.calculateRatio()
    expect(calculateRatio).toBe(0)
  })

  it('calculateRatio returns the ratio in 2 decimal places given the right argument', async () => {
    const smallSampleData = ['1', '1', '1', '1', '1']
    const minRequiredData = Array.from('1'.repeat(25))

    expect(wrapper.vm.calculateRatio(smallSampleData)).toBe('0.00')
    // minimum no of array[i] = 1 to return ratio greater than 0 is 25
    expect(wrapper.vm.calculateRatio(minRequiredData)).toBe('0.01')
  })

  // @Note => the methods createSvg and update seem like they have error (they assign values to undeclared data properties)
})
