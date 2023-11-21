import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, mount, createLocalVue } from '@vue/test-utils'
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import { mockDataPoint } from './constants'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueMaterial)

const rangeList = ['1', '2']

describe('RangeSelector', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(RangeSelector, {}, false)
    await wrapper.setData({
      rangeList: rangeList
    })
  })

  enableAutoDestroy(afterEach)

  afterEach(async () => {
    wrapper.destroy()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders layout', async () => {
    expect(wrapper.findComponent('.slider').exists()).toBe(true)
    expect(wrapper.findComponent('input').exists()).toBe(true)
  })
  it('renders data returned from mapState', async () => {
    const wrapper = mount(RangeSelector, {
      computed: {
        activeData: () => [mockDataPoint],
        dataLibrary: () => [],
        datasets: () => [mockDataPoint]
      },
      localVue
    })
    await wrapper.setData({
      rangeList: rangeList
    })
    expect(wrapper.vm.rangeList).toEqual(rangeList)
  })
})
