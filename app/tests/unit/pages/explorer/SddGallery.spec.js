import createWrapper from '../../../jest/script/wrapper'
import { RouterLinkStub } from '@vue/test-utils'
import DatasetGallery from '@/pages/explorer/dataset/DatasetGallery.vue'
import store from '@/store/index.js'

const dispatch = jest.spyOn(store, 'dispatch').mockImplementation(() => {})

const mockValues = [
  {
    description: 'Dataset description 1',
    identifier: 'http://materialsmine.org/explorer/dataset/0001',
    label: 'Test Dataset 1',
    distribution: 'fakefile1.csv'
  },
  {
    description: 'Dataset description 2',
    identifier: 'http://materialsmine.org/explorer/dataset/0002',
    label: 'Test Dataset 2',
    distribution: 'fakefile2.csv',
    thumbnail: 'fakeImage2.png'
  },
  {
    description: 'Dataset description 3',
    identifier: 'http://materialsmine.org/explorer/dataset/0003',
    label: 'Test Dataset 3',
    distribution: 'fakefile3.csv',
    thumbnail: 'fakeImage3.png'
  }
]

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockValues),
    statusText: 'OK',
    status: 200
  })
)

describe('DatasetGallery.vue', () => {
  let wrapper
  beforeAll(async () => {
    wrapper = await createWrapper(DatasetGallery, { }, true)
    await wrapper.vm.$store.commit('explorer/sddDatasets/setDatasetTotal', mockValues.length)
    await wrapper.vm.$store.commit('explorer/sddDatasets/setDatasetPage', 1)
    await wrapper.vm.$store.commit('explorer/sddDatasets/setDatasetList', mockValues)
  })

  it('loads datasets', () => {
    expect(dispatch).toHaveBeenCalledWith('explorer/sddDatasets/loadDatasets', { page: 1 })
    expect(wrapper.findAll('.gallery-item').length).toBe(mockValues.length)
  })

  it('shows number of results', () => {
    expect(wrapper.find('.u_content__result').text()).toMatch(
      /[1-9]\d* result/
    )
  })

  it('provides links for each result', async () => {
    const items = wrapper.vm.items
    expect.assertions(items.length)
    for (const idx of mockValues.keys()) {
      const item = items[idx]
      expect(
        wrapper.findAllComponents(RouterLinkStub).at(idx).props().to
      ).toEqual({
        name: 'DatasetVisualizer',
        params: { id: item.identifier.split('dataset/')[1] }
      })
    }
  })

  it('provides title and description for each result', async () => {
    expect.assertions(2 * mockValues.length)
    for (const idx of mockValues.keys()) {
      expect(wrapper.findAll('.md-card-header > .md-subheading').at(idx).text())
        .toContain(mockValues[idx].label)
      expect(wrapper.findAll('.md-card-header > .md-body-1').at(idx).text())
        .toContain(mockValues[idx].description)
    }
  })

  it('renders search box and button', () => {
    const searchBox = wrapper.find('.search_box_form')
    const searchButton = wrapper.findAll('button').at(0)
    expect(searchBox.exists()).toBe(true)
    expect(searchButton.exists()).toBe(true)
    expect(searchBox.text()).toContain('Search Datasets')
  })

  it('dispatches search with term', async () => {
    await wrapper.setData({ searchWord: 'testTerm', searchEnabled: true })
    await wrapper.findAll('button').at(0).trigger('click')
    expect(dispatch).toHaveBeenCalledWith('explorer/sddDatasets/searchDatasetKeyword', {
      searchTerm: 'testTerm',
      page: 1
    })
  })
})

// Todo (ticket-xx): Centralize this function
function setWidth (arg, arg2) {
  return arg === arg2
}
function callWindowObject (arg) {
  const resp = Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: setWidth(query, arg),
      media: query,
      onchange: null
    }))
  })
  return resp
}

callWindowObject()
