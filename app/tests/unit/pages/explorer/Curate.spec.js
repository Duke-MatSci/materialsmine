import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ExplorerCurate from '@/pages/explorer/Curate.vue'

describe('Curate.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ExplorerCurate, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('renders curate tab correctly', () => {
    expect.assertions(1)
    const catHeader = wrapper.find('.visualize_header-h1')
    expect(catHeader.exists()).toBe(true)
  })

  it('renders curate category headers', () => {
    expect.assertions(3)
    const catHeaders = wrapper.findAll('.visualize_header-h1')
    expect(catHeaders.length).toEqual(2)
    expect(catHeaders.at(0).text()).toBe('Curate')
    expect(catHeaders.at(1).text()).toBe('Create Visualization')
  })
})
