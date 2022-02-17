import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ExplorerGallery from '@/pages/explorer/Gallery.vue'

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
    expect(wrapper.find('.u_content__result').text()).toMatch(/^About [1-9]\d* results/)
  })

  it('provides links for each result', () => {
    const items = wrapper.vm.items
    expect.assertions(items.length)
    console.log(items.length)
    for (const item of items) {
      expect(
        wrapper.findAllComponents(RouterLinkStub)
          .filter(w => w.props().to === `/explorer/chart/view/${item.id}`)
          .at(0)
          .exists()
      ).toBe(true)
    }
  })

  it('paginates gallery items', async () => {
    const initialItemId = wrapper.vm.items[0].id
    await wrapper.find('.pagination-button-next')
      .trigger('click')
    const newItemId = wrapper.vm.items[0].id
    expect(newItemId).not.toEqual(initialItemId)
  })
})
