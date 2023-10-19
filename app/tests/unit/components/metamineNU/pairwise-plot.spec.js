import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import PairwisePlot from '@/components/metamine/visualizationNU/pairwise.vue'
import * as d3 from 'd3'

/*
* Stub out the mounted method
* no error handling for multiple successive fetch calls
* throws errors
* also consider seperating the functions
 */

const onMountspy = jest.spyOn(PairwisePlot, 'mounted').mockImplementation(() => {})

describe('PairwisePlot', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(PairwisePlot, {}, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'pairwisePlot' }).exists()).toBe(true)
    expect(onMountspy).toHaveBeenCalledTimes(1)
  })

  it('createSvg modifies the right data parameters', async () => {
    const container = wrapper.vm.$refs.pairwisePlot
    const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
    const spy = jest.spyOn(d3, 'map')
    const zDomain = new d3.InternSet([])

    expect(wrapper.vm.chart).toBe(false)
    expect(wrapper.vm.svg).toBe()
    expect(wrapper.vm.cell).toBe()
    expect(wrapper.vm.cellWidth).toBe()
    expect(wrapper.vm.cellHeight).toBe()
    expect(wrapper.vm.X).toBe()

    await wrapper.vm.createSvg({ container, columns })
    expect(spy).toHaveBeenCalled()

    expect(wrapper.vm.chart).toBe(true)
    expect(wrapper.vm.svg).not.toBe()
    expect(wrapper.vm.cell).not.toBe()
    expect(wrapper.vm.X).toEqual([[], [], [], [], [], []])
    expect(wrapper.vm.Y).toEqual([[], [], [], [], [], []])
    expect(wrapper.vm.Z).toEqual([])
    expect(wrapper.vm.zDomain).toEqual(zDomain)

    expect(wrapper.find('.xAxisGroup').exists()).toBe(true)
    expect(wrapper.find('.yAxisGroup').exists()).toBe(true)
  })
})
