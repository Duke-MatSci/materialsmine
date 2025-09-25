import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ParamSelector from '@/components/metamine/visualizationNU/ParamSelector.vue'

const elementMock = { addEventListener: jest.fn() }
jest.spyOn(document, 'getElementById').mockImplementation(() => elementMock)
describe('ParamSelector.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ParamSelector, {}, false)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
  })

  it('renders layout properly ', () => {
    expect(
      wrapper
        .find(
          'div > div.md-title.article_metadata_strong.section_footer.utility-transparentbg'
        )
        .exists()
    ).toBe(true)
    expect(wrapper.find('div > div.article_metadata_strong').exists()).toBe(
      true
    )
    expect(wrapper.findAll('div > div.article_metadata_strong').length).toBe(2)
    expect(
      wrapper
        .find(
          'div > div.u_display-flex.md-layout.u--layout-flex-justify-sb.tool_page'
        )
        .exists()
    ).toBe(true)
  })

  it('renders flex layout properly ', () => {
    const container = wrapper.find(
      'div.u_display-flex.md-layout.u--layout-flex-justify-sb'
    )
    expect(container.find('div.md-layout-item.md-size-80').exists()).toBe(true)
    expect(
      container.find('div.utility-roverflow.md-layout-item.md-size-20').exists()
    ).toBe(true)
  })

  it('renders slider input properly ', async () => {
    const commit = jest.spyOn(wrapper.vm.$store, 'commit')
    const slider = wrapper.find(
      'input.nuplot-range-slider.u--margin-centered.u_centralize_text.viz-u-postion__abs.utility-transparentbg'
    )
    slider.element.value = '25'
    await slider.trigger('change')

    expect(wrapper.vm.knnUmap).toBe('25')
    expect(commit).toHaveBeenCalledWith('metamineNU/setKnnUmap', '25')
  })

  it('renders text input properly ', async () => {
    const commit = jest.spyOn(wrapper.vm.$store, 'commit')
    const input = wrapper.findComponent('md-input-stub')
    input.element.value = '10'
    await input.trigger('change')

    expect(wrapper.vm.knnUmap).toBe('25')
    expect(commit).toHaveBeenCalledWith('metamineNU/setKnnUmap', '25')
  })
})
