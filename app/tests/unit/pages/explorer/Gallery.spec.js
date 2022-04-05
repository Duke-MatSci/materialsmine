import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ExplorerGallery from '@/pages/explorer/Gallery.vue'
import { chartUriPrefix, toChartId } from '@/modules/vega-chart'

import { loadJsonView } from '@/modules/whyis-view'
jest.mock('@/modules/whyis-view')
loadJsonView.mockImplementation(() => {
  return [...Array(333).keys()].map((i) => ({
    identifier: `${chartUriPrefix}gallery_item_${i}`,
    label: `Gallery Item #${i}: a label`,
    description: `this text describes Gallery Item #${i}`
  }))
})

describe('ExplorerHome.vue', () => {
  const itemsPerPage = 50
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ExplorerGallery, {}, true)
  })

  enableAutoDestroy(afterEach)

  it(`loads ${itemsPerPage} items`, () => {
    expect.assertions(1)
    expect(wrapper.findAll('.gallery-item').length).toBe(itemsPerPage)
  })

  it('shows number of results', () => {
    expect.assertions(1)
    expect(wrapper.find('.u_content__result').text()).toMatch(
      /^About [1-9]\d* results/
    )
  })

  it('provides links for each result', () => {
    const items = wrapper.vm.items
    expect.assertions(items.length)
    for (const idx of items.keys()) {
      const item = items[idx]
      expect(
        wrapper.findAllComponents(RouterLinkStub).at(idx).props().to
      ).toEqual({
        name: 'ChartView',
        params: { chartId: toChartId(item.identifier) }
      })
    }
  })

  it('paginates gallery items', async () => {
    const initialItemId = wrapper.vm.items[0].identifier
    await wrapper.find('.pagination-button-next').trigger('click')
    const newItemId = wrapper.vm.items[0].identifier
    expect(newItemId).not.toEqual(initialItemId)
  })
})
