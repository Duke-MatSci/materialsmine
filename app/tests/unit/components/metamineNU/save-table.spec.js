import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, mount, createLocalVue } from '@vue/test-utils'
import SaveDataPanel from '@/pages/metamine/visualizationNU/components/SaveDataPanel.vue'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import { mockDataPoint } from './constants'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueMaterial)

describe('SaveDataPanel', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(SaveDataPanel, {}, true)
  })

  enableAutoDestroy(afterEach)

  afterEach(async () => {
    wrapper.destroy()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders layout', () => {
    const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save Data Panel')
    columns.forEach((column) => {
      expect(wrapper.text()).toContain(column)
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })
  it('renders data in selectedData', () => {
    const wrapper = mount(SaveDataPanel, {
      computed: {
        selectedData: () => [mockDataPoint]
      },
      localVue
    })

    expect(wrapper.vm.selectedData).toEqual([mockDataPoint])
    expect(wrapper.text()).toContain('90620000')
    expect(wrapper.text()).toContain('2093000')
    expect(wrapper.text()).toContain('90620000')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('88310')
  })
})
