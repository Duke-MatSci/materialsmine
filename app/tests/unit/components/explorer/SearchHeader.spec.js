import createWrapper from '../../../jest/script/wrapper'
import SearchHeader from '@/components/explorer/SearchHeader.vue'
describe('SearchHeader.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(SearchHeader, {}, true)
  })
  it('renders search bar', async () => {
    expect.assertions(1)
    const searchBar = wrapper.find('.search_box_form')
    expect(searchBar.text()).toContain('Search')
  })
  it('renders header tabs correctly', async () => {
    expect.assertions(1)
    const headerTabs = wrapper.findAll('.md-tab')
    expect(headerTabs.length).toBe(5)
  })
})
