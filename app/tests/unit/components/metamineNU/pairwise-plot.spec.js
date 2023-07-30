import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import PairwisePlot from '@/pages/metamine/visualizationNU/components/pairwise-plot.vue'
import * as d3 from 'd3'

/*
* Stub out the mounted method
* no error handling for multiple successive fetch calls
* throws errors
* also consider seperating the functions
 */

const datasetSample = [
  {
    name: 'test',
    color: 'red',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'sample',
    color: 'yellow',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'test',
    color: 'orange',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'sample',
    color: 'green',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'test',
    color: 'blue',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  }
]

const organizedDataset = [
  {
    name: 'test',
    color: 'red',
    data: [datasetSample[0], datasetSample[2], datasetSample[4]]
  },
  {
    name: 'sample',
    color: 'yellow',
    data: [datasetSample[1], datasetSample[3]]
  }
]

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

  it('organizeByName organizes data by name  and returns an array of object ', async () => {
    const result = await wrapper.vm.organizeByName(datasetSample)
    expect(result).toEqual(organizedDataset)
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
    expect(wrapper.vm.cellWidth).toBe(124.66666666666667)
    expect(wrapper.vm.X).toEqual([[], [], [], [], [], []])
    expect(wrapper.vm.Y).toEqual([[], [], [], [], [], []])
    expect(wrapper.vm.Z).toEqual([])
    expect(wrapper.vm.zDomain).toEqual(zDomain)
  })
})