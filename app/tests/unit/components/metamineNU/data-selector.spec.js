import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import { mockDataPoint } from './constants'

const fetchedNamesSample = [
  {
    name: '1',
    color: 'red'
  },
  {
    name: '2',
    color: 'yellow'
  }
]

describe('DataSelector', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(DataSelector, {}, true)
  })

  enableAutoDestroy(afterEach)

  afterEach(async () => {
    await jest.resetAllMocks()
    wrapper.destroy()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders layout', async () => {
    expect(wrapper.find('div.data-selector-wrapper > .data-row').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('renders empty state if fetchedNames is empty', async () => {
    await wrapper.vm.$store.commit('metamineNU/setFetchedNames', [])
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('table').text()).toBe('No data available')
  })

  it('handleQuery1Change dispatches the right action ', async () => {
    const storeSpy = jest.spyOn(wrapper.vm.$store, 'dispatch')
    await wrapper.vm.handleQuery1Change('C11')
    await wrapper.vm.handleQuery2Change('C12')
    expect(storeSpy).toHaveBeenNthCalledWith(1, 'metamineNU/setQuery1', 'C11')
    expect(storeSpy).toHaveBeenNthCalledWith(2, 'metamineNU/setQuery2', 'C12')
  })

  it('renders data returned from mapState', async () => {
    await wrapper.vm.$store.commit('metamineNU/setFetchedNames', fetchedNamesSample)
    await wrapper.vm.handleQuery1Change('C11')
    await wrapper.vm.handleQuery2Change('C12')
    await wrapper.vm.$store.commit('metamineNU/setActiveData', [mockDataPoint])
    await wrapper.vm.$store.commit('metamineNU/setDataLibrary', [])
    await wrapper.vm.$store.commit('metamineNU/setPage', 'pairwise-plot')
    expect(wrapper.vm.fetchedNames).toEqual(fetchedNamesSample)
    expect(wrapper.vm.query1).toEqual('C11')
    expect(wrapper.vm.query2).toEqual('C12')
    expect(wrapper.findAllComponents('tr').length).toEqual(2)
  })

  it('onSelect Method mutates the expected data', async () => {
    await wrapper.vm.$store.commit('metamineNU/setFetchedNames', fetchedNamesSample)
    await wrapper.vm.$store.commit('metamineNU/setQuery1', 'C11')
    await wrapper.vm.$store.commit('metamineNU/setQuery2', 'C12')
    await wrapper.vm.$store.commit('metamineNU/setActiveData', [])
    await wrapper.vm.$store.commit('metamineNU/setDataLibrary', [])
    await wrapper.vm.$store.commit('metamineNU/setPage', 'pairwise-plot')
    const storeSpy = jest.spyOn(wrapper.vm.$store, 'dispatch')
    await wrapper.vm.onSelect([fetchedNamesSample[0]])
    expect(storeSpy).toHaveBeenCalledTimes(6)
  })
})
