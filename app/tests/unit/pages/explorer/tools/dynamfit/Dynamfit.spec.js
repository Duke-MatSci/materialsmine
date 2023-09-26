import createWrapper from '../../../jest/script/wrapper'
import DynamFit from '@/pages/explorer/tools/dynamfit/DynamFit.vue'

describe('DynamFit.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(DynamFit, { }, false)
  })

  it('renders layout', () => {
    expect(wrapper.find('.explorer_page_header').exists()).toBe(true)
    expect(wrapper.find('.visualize_header-h1.u_margin-top-med.u_centralize_text').exists()).toBe(true)
  })
})
