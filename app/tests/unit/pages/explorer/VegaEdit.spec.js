import VueMaterial from 'vue-material'
import { enableAutoDestroy, mount, createLocalVue, resetAutoDestroyState } from '@vue/test-utils'
import VegaEdit from '@/pages/explorer/vega/edit/VegaEdit.vue'
import store from '@/store'

document.body.createTextRange = (elem) => {
  const textRange = {
    getBoundingClientRect: () => 1,
    getClientRects: () => 1
  }
  return textRange
}

describe('VegaEdit.vue', () => {
  let wrapper
  beforeEach(async () => {
    const localVue = createLocalVue()
    localVue.use(VueMaterial)
    wrapper = mount(VegaEdit, {
      localVue,
      store
    })
  })
  enableAutoDestroy(afterEach)
  afterAll(resetAutoDestroyState)

  it('renders yasqe', () => {
    expect(wrapper.findComponent('.yasqe').exists()).toBeTruthy()
  })
  it('renders yasr', () => {
    expect(wrapper.findComponent('.yasr').exists()).toBeTruthy()
  })
  it('renders a vjson editor if spec', async () => {
    await wrapper.vm.setBaseSpec('test')
    expect(wrapper.findComponent('.jsoneditor-container').exists()).toBeTruthy()
  })
  it('renders the save tab correctly', () => {
    const titleField = wrapper.findComponent('.chart-title-field')
    const descriptionField = wrapper.findComponent('.chart-description-field')
    const submitButton = wrapper.findComponent('#saveChartButton')
    expect(titleField.text()).toContain('Title')
    expect(descriptionField.text()).toContain('Description')
    expect(submitButton.text()).toContain('Save Chart')
  })
})
