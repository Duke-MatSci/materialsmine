import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, mount } from '@vue/test-utils'
import NeighborPanel from '@/components/metamine/visualizationNU/NeighborPanel.vue'
import { mockDataPoint } from './constants'
import store from '@/store'

describe('NeighborPanel', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(NeighborPanel, {}, true)
  })

  enableAutoDestroy(afterEach)

  afterEach(async () => {
    wrapper.destroy()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders layout', () => {
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nearest Neighbors Panel')
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.md-icon').exists()).toBe(true)
  })
  it('renders data in neighbors', () => {
    const wrapper = mount(NeighborPanel, {
      computed: {
        neighbors: () => [mockDataPoint]
      },
      store
    })

    expect(wrapper.vm.neighbors).toEqual([mockDataPoint])
    expect(wrapper.text()).toContain('90620000')
    expect(wrapper.text()).toContain('2093000')
    expect(wrapper.text()).toContain('90620000')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('88310')
  })
})
