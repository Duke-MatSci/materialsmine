import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import SearchGallery from '@/components/XmlSearchUtil.vue'

describe('@/components/SearchGallery.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(SearchGallery, {
      slots: {
        search_input: '<input type="text" class="random-class" placeholder="Search" />',
        action_buttons: '<button type="submit" class="random-btn-class"> Search </button>',
        page_input: '<input type="number" max="20" class="random-number-class"/>',
        default: '<div class="md-card">Main Content</div>',
        pagination: '<ul><li>1</li></ul>'
      },
      props: {
        isEmpty: false,
        totalItems: 4,
        loading: false,
        error: false,
        searchForm: true
      }
    }, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
    await jest.resetAllMocks()
  })
  // Visual assertions
  it('loads page with the necessary styles', async () => {
    expect.assertions(4)
    const utilityContainer = wrapper.findAll('.gallery > .utility-roverflow')
    expect(wrapper.find('.gallery').exists()).toBe(true)
    expect(utilityContainer.length).toBe(2)
    expect(utilityContainer.at(0).attributes().class).toBe('utility-roverflow u--margin-toplg')
    expect(utilityContainer.at(1).find('.u_content__result.u_margin-top-small').exists()).toBe(true)
  })

  it('loads form layout properly', () => {
    expect.assertions(4)
    expect(wrapper.find('.gallery > .utility-roverflow > .search_box').exists()).toBe(true)
    expect(wrapper.find('.search_box.card-icon-container.u--margin-toplg').exists()).toBe(true)
    expect(wrapper.find('form.form > .search_box_form > .form__group').exists()).toBe(true)
    expect(wrapper.find('form.form > .form__group').exists()).toBe(true)
  })

  it('loads form elements properly given from slots data', async () => {
    expect.assertions(3)
    const form = wrapper.find('form.form')
    const inputContainer = form.find('.form__group.search_box_form-item-1')
    const buttonContainer = form.findAll('.form__group.search_box_form-item-2').at(1)
    expect(inputContainer.find('.random-class').exists()).toBe(true)
    expect(inputContainer.find('.form__label.search_box_form_label').text()).toBe('Search Xml')
    expect(buttonContainer.find('button').text()).toBe('Search')
  })

  it('displays error slot on error', async () => {
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med').exists()).toBe(false)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').exists()).toBe(false)
    await wrapper.setProps({ error: true })
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med').exists()).toBe(true)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').exists()).toBe(true)
  })
})
