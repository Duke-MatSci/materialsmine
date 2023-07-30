import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import DataSelector from '@/pages/metamine/visualizationNU/components/DataSelector.vue'

describe('DataSelector', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(DataSelector, {}, false)
  })

  enableAutoDestroy(afterEach)

  afterEach(async () => {
    wrapper.destroy()
  })

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders layout', async () => {
    expect(wrapper.find('div.data-selector-wrapper > .data-row').exists()).toBe(true)
    expect(wrapper.find('div.data-selector-wrapper > .data-row > a-table').exists()).toBe(true)
  })
})