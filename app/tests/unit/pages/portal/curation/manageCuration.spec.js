import createWrapper from '../../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ManageCuration from '@/pages/portal/curation/ManageCuration.vue'
import store from '@/store'

const commit = jest.spyOn(store, 'commit').mockImplementation(() => {})
const xmlFinder = {
  totalItems: 400,
  pageSize: 4,
  pageNumber: 1,
  totalPages: 100,
  hasPreviousPage: false,
  hasNextPage: true,
  xmlData: [
    {
      id: '58587cfee74a1d205f4eae8d',
      isNewCuration: false,
      title: "L175_S8_O'Reilly_2015.xml",
      entityState: 'EditedValid',
      sequence: 175,
      __typename: 'XmlCatalogs'
    },
    {
      id: '583e3adde74a1d205f4e3a99',
      isNewCuration: false,
      title: 'L183_S11_Poetschke_2003.xml',
      entityState: 'EditedValid',
      sequence: 183,
      __typename: 'XmlCatalogs'
    },
    {
      id: '583e38c4e74a1d205f4e3034',
      isNewCuration: false,
      title: 'L183_S5_Poetschke_2003.xml',
      entityState: 'EditedValid',
      sequence: 183,
      __typename: 'XmlCatalogs'
    },
    {
      id: '58587c9be74a1d205f4ea8c8',
      isNewCuration: false,
      title: "L175_S6_O'Reilly_2015.xml",
      entityState: 'EditedValid',
      sequence: 175,
      __typename: 'XmlCatalogs'
    }
  ],
  __typename: 'XmlDataList'
}

const emptySearchResult = {
  totalItems: 0,
  pageSize: 20,
  pageNumber: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  xmlData: [],
  __typename: 'XmlDataList'
}
describe('ManageCuration.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ManageCuration, {
      mocks: {
        $apollo: {
          loading: false,
          queries: {
            xmlFinder: {
              refetch: jest.fn()
            }
          }
        }
      },
      stubs: { pagination: true }
    }, true)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', { icon: '', name: 'Manage Curation' })
  })

  it('renders layout', () => {
    expect(wrapper.find('.viz-u-mgup-sm > .md-card-header > .md-card-header-text > .md-body-1').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm.utility-margin.md-theme-default').exists()).toBeTruthy()
    expect(wrapper.find('.md-card-header.md-card-header-flex').exists()).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-body-1').text()).toBe('Administrators can manage curations. Accepted actions include delete, approve, and update curated samples status')
  })

  // Visual assertions
  it('loads page with the necessary styles', async () => {
    expect.assertions(4)
    const utilityContainer = wrapper.findAll('.gallery > .utility-roverflow')
    expect(wrapper.find('.gallery').exists()).toBe(true)
    expect(utilityContainer.length).toBe(3)
    expect(utilityContainer.at(0).attributes().class).toBe('utility-roverflow')
    expect(utilityContainer.at(1).find('.u_content__result.u_margin-top-small').exists()).toBe(true)
  })

  it('loads form layout properly', () => {
    expect.assertions(4)
    expect(wrapper.find('.gallery > .utility-roverflow > .search_box').exists()).toBe(true)
    expect(wrapper.find('.search_box.card-icon-container').exists()).toBe(true)
    expect(wrapper.find('form.form > .search_box_form > .form__group').exists()).toBe(true)
    expect(wrapper.find('form.form > .form__group').exists()).toBe(true)
  })

  it('loads form elements properly', async () => {
    expect.assertions(3)
    const form = wrapper.find('form.form')
    const inputContainer = form.find('.form__group.search_box_form-item-1')
    const buttonContainer = form.findAll('.search_box_form-item-2').at(1)
    expect(inputContainer.find('.form__input.form__input--flat').exists()).toBe(true)
    expect(inputContainer.find('.form__label.search_box_form_label').text()).toBe('Search Xml')
    expect(buttonContainer.findAll('button').at(4).text()).toBe('Search Xml')
  })

  it('submits button calls the right method', async () => {
    const spy = jest.spyOn(wrapper.vm, 'submitSearch').mockImplementation(() => {})
    const button = wrapper.find('.md-button.btn.btn--primary.btn--noradius.u--margin-pos')
    await wrapper.find('.form__input.form__input--flat').setValue('TestValue')
    await button.trigger('click')
    expect(spy).toHaveBeenCalled()
  })

  it('shows number of results when none', async () => {
    expect.assertions(4)
    expect(wrapper.find('.utility-roverflow').exists()).toBe(true)
    expect(wrapper.find('.u_content__result').exists()).toBe(true)
    expect(await wrapper.find('#css-adjust-navfont > span').text()).toMatch(
      /[1-9]\d*|No result/
    )
    expect(wrapper.find('.utility-absolute-input').text()).toMatch('Page size:')
  })

  it('renders xml title and description', async () => {
    expect.assertions(6)
    await wrapper.setData({ xmlFinder: xmlFinder })
    const xml = wrapper.findAll('.gallery-item')
    expect(xml.length).toBe(xmlFinder.xmlData.length)
    expect(xml.at(0).html()).toContain(xmlFinder.xmlData[0].title)
    expect(xml.at(0).find('.md-body-2').exists()).toBe(true)
    expect(xml.at(0).find('.md-body-2').text()).not.toBe('')
    expect(xml.at(0).find('.md-body-1').exists()).toBe(true)
    expect(xml.at(0).find('.md-body-1').text()).toBe('Click to view')
  })

  it('provides links for each result', async () => {
    await wrapper.setData({ xmlFinder: xmlFinder })
    const xml = wrapper.vm.xmlFinder.xmlData
    expect.assertions(xml.length)
    for (let i = 0; i < xml.length; i++) {
      expect(
        await wrapper.findAllComponents(RouterLinkStub).at(i).props().to
      ).toEqual({
        name: 'XmlVisualizer',
        params: { id: xmlFinder.xmlData[i].id },
        query: { isNewCuration: `${xmlFinder.xmlData[i].isNewCuration}` }
      })
    }
  })

  it('mounts pagination component with the right parameters and calls the right method', async () => {
    expect.assertions(3)
    var spy = jest.spyOn(wrapper.vm, 'loadPrevNextImage').mockImplementation(() => {})
    await wrapper.setData({ xmlFinder: xmlFinder })
    const pagination = wrapper.findComponent('pagination-stub')

    expect(pagination.props().cpage).toBe(xmlFinder.pageNumber)
    expect(pagination.props().tpages).toBe(xmlFinder.totalPages)

    await pagination.vm.$emit('go-to-page', 2)
    expect(spy).toHaveBeenCalledWith(2)
  })

  it('displays expected message when network error', async () => {
    var expectedString = 'Cannot Load Xml List'
    await wrapper.setData({ xmlFinder: xmlFinder })
    expect(wrapper.vm.isEmpty).toBe(false)
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med').exists()).toBe(false)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').exists()).toBe(false)
    await wrapper.setData({ xmlFinder: [], error: 'Network Error: 500 Connection Aborted' })
    expect(wrapper.vm.isEmpty).toBe(true)
    expect(wrapper.find('.utility-roverflow.u_centralize_text').exists()).toBe(true)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').text()).toBe(expectedString)
  })

  it('displays expected message when search result empty', async () => {
    var expectedString = 'Sorry! No Xml Found'
    await wrapper.setData({ xmlFinder: xmlFinder, error: null })
    expect(wrapper.vm.isEmpty).toBe(false)
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med').exists()).toBe(false)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').exists()).toBe(false)
    await wrapper.setData({ xmlFinder: emptySearchResult })
    expect(wrapper.vm.isEmpty).toBe(true)
    expect(wrapper.find('.utility-roverflow.u_centralize_text').exists()).toBe(true)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').text()).toBe(expectedString)
  })
})
