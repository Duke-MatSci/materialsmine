import createWrapper from '../../../../jest/script/wrapper'
import XsdView from '@/pages/portal/curation/xsd/XsdViewer.vue'

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    statusText: 'OK',
    status: 200
  })
)

describe('XsdView.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(XsdView, {}, false)
  })

  afterEach(() => {
    wrapper.destroy()
    fetch.mockClear()
  })

  it('page mounts properly', () => {
    expect.assertions(2)
    expect(wrapper.exists()).toBeTruthy()
    expect(fetch).toHaveBeenCalled()
  })

  it('renders components properly', async () => {
    expect.assertions(2)
    wrapper.setData({ xsd: null })
    expect(wrapper.findComponent({ name: 'spinner' }).exists()).toBeTruthy()
    await wrapper.setData({ xsd: 'any value' })
    expect(wrapper.findComponent({ name: 'spinner' }).exists()).toBe(true)
  })
})
