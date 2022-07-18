import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ExplorerGallery from '@/pages/explorer/Gallery.vue'
import { chartUriPrefix, toChartId } from '@/modules/vega-chart'

const itemsPerPage = 1;

const mockValues = {
  data: [
    {
      _source: {
        description: 'Filler particles may be treated with a particle surface treatment to improve dispersion within the matrix. Here, pie and donut charts serve as an abstract illustration of this concept alongside Glass Transition Temperature (Tg) data. Hover over a region in the pie or donut charts to see a tooltip with the Matrix, Filler, or Particle Surface Treatment. Click and drag in either scatter plot to define a selection window, then click and drag or scroll to adjust the selection window. To pan or zoom in a scatter plot, hold down Shift while dragging or scrolling.',
        identifier: `http://nanomine.org/viz/d0c4446ac8ddd0ed${Math.random()}`,
        label: 'Kaleidoscopic Nanocomposites',
      }
    }
  ],
  total: itemsPerPage
}

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockValues),
    statusText: 'OK',
    status: 200
  })
);

describe('Gallery.vue', () => {
  let wrapper
  beforeEach(async() => {
    fetch.mockClear();
    wrapper = await createWrapper(ExplorerGallery, {}, true)
  })

  enableAutoDestroy(afterEach)

  it(`loads ${itemsPerPage} items`, () => {
    expect.assertions(1)
    expect(wrapper.findAll('.gallery-item').length).toBe(itemsPerPage)
  })

  it('shows number of results', () => {
    expect.assertions(1)
    expect(wrapper.find('.u_content__result').text()).toMatch(
      /[1-9]\d* result/
    )
  })

  it('provides links for each result', async () => {
    const items = wrapper.vm.items
    expect.assertions(items.length)
    for (const idx of items.keys()) {
      const item = items[idx]
      expect(
        await wrapper.findAllComponents(RouterLinkStub).at(idx).props().to
      ).toEqual({
        name: 'ChartView',
        params: { chartId: toChartId(item.identifier) }
      })
    }
  })

  /* MOCK RETURNS 1 ITEM THIS NO LONGER APPLIES */
  // it('paginates gallery items', async () => {
  //   debugger;
  //   const initialItemId = wrapper.vm.items[0].identifier
  //   await wrapper.find('.pagination-button-next').trigger('click')
  //   const newItemId = wrapper.vm.items[0].identifier
  //   expect(newItemId).not.toEqual(initialItemId)
  // })
})
