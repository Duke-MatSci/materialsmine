import createWrapper from '../../../../../jest/script/wrapper'
import DynamFit from '@/pages/explorer/tools/dynamfit/DynamFit.vue'

describe('DynamFit.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(DynamFit, {}, false)
  })

  it('renders layout', () => {
    const template = wrapper.find('article.u_width--max')
    expect(template.exists()).toBe(true)
    expect(template.findAll('header').length).toBe(1)
    expect(template.findAll('main').length).toBe(1)
  })

  it('renders header text', () => {
    const headerContainer = wrapper.find('header.explorer_page_header')
    expect(headerContainer.exists()).toBe(true)
    expect(
      headerContainer
        .find('h1.visualize_header-h1.u_margin-top-med.u_centralize_text')
        .exists()
    ).toBe(true)
    expect(
      headerContainer
        .find('h1.visualize_header-h1.u_margin-top-med.u_centralize_text')
        .text()
    ).toBe('DynamFit')
  })

  describe('DynamFit.vue Main section', () => {
    let main
    beforeEach(async () => {
      main = wrapper.find('main')
    })

    it('styles and label main section accordingly', () => {
      expect(main.attributes('class')).toBe(
        'u--margin-posmd md-layout md-alignment-top-space-around'
      )
      expect(main.attributes('aria-label')).toBe('dynamfit-main')
    })

    it('renders aside properly', () => {
      const aside = main.findAll('aside')
      expect(aside.length).toBe(1)
      expect(aside.at(0).attributes('class')).toBe(
        'md-layout-item md-size-25 md-medium-size-35 md-small-size-100 md-xsmall-size-100 u_height--auto'
      )
      expect(aside.at(0).attributes('aria-label')).toBe('dynamfit-setting')
      expect(aside.at(0).findComponent('chartsetting-stub').exists()).toBe(
        true
      )
    })

    it('renders dynafit-data section properly with the right component', () => {
      const section = main.findAll('section')
      expect(section.length).toBe(1)
      expect(section.at(0).attributes('class')).toBe(
        'md-layout-item md-size-70 md-medium-size-60 md-small-size-100 md-xsmall-size-100 u_height--auto'
      )
      expect(section.at(0).attributes('aria-label')).toBe('dynamfit-data')
      expect(section.at(0).findComponent('chartvisualizer-stub').exists()).toBe(
        true
      )
    })
  })
})
