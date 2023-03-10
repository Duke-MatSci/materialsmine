import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import XlsList from '@/pages/explorer/curate/validlist/XlsList.vue'

describe('Spreadsheet List Form.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(XlsList, {
      stubs: {
        MdField: { template: '<div class="md-field-stub"><slot/></div>' },
        MdInput: { template: '<input>' }
      }
    }, false)
  })

  enableAutoDestroy(afterEach)

  it('renders header tab correctly', () => {
    expect.assertions(2)
    const catHeader = wrapper.find('.visualize_header-h1.article_title.u_centralize_text')
    expect(catHeader.exists()).toBe(true)
    expect(catHeader.html()).toMatch('Spreadsheet List Form')
  })

  it('renders page structure properly', () => {
    expect.assertions(4)
    expect(wrapper.find('.section_teams').exists()).toBe(true)
    expect(wrapper.find('.md-layout.md-gutter.md-alignment-top-center').exists()).toBe(true)
    expect(wrapper.find('.md-layout-item.md-size-50.md-medium-size-70.md-small-size-85.md-xsmall-size-95').exists()).toBe(true)
    expect(wrapper.findAll('.section_teams > div > div > .md-layout > .md-layout-item').length).toBe(1)
  })

  it('renders page input properly', () => {
    expect.assertions(4)
    const field = wrapper.findAll('.md-field-stub')
    expect(field.length).toBe(2)
    const name = field.at(0)
    expect(name.find('p').text()).toBe('FieldName:')
    expect(name.find('span').text()).toBe('Section::Subsection::Unit')
    const value = field.at(1)
    expect(value.find('p').text()).toBe('Value:')
  })

  it('renders buttons properly', () => {
    expect.assertions(7)
    expect(wrapper.find('.form__group.search_box_form-item-2.explorer_page-nav.u_margin-top-med').exists()).toBe(true)
    expect(wrapper.findAll('.btn.btn--noradius.search_box_form_btn.mid-first-li.display-text.u--margin-pos').length).toBe(2)
    const button = wrapper.findAll('button')
    expect(button.length).toBe(2)
    expect(button.at(0).attributes().class).toContain('btn--tertiary')
    expect(button.at(0).text()).toContain('Add more')
    expect(button.at(1).attributes().class).toContain('btn--primary')
    expect(button.at(1).text()).toContain('Submit')
  })

  // Test for the tables
})