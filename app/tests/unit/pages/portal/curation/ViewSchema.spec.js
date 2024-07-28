import createWrapper from '../../../../jest/script/wrapper'
import ViewCuration from '@/pages/portal/curation/ViewSchema.vue'
import store from '@/store'

const commit = jest.spyOn(store, 'commit').mockImplementation(() => {})

describe('ViewCuration.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ViewCuration, {}, false)
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', {
      icon: '',
      name: 'View Schema'
    })
  })

  it('renders layout', () => {
    expect(
      wrapper
        .find(
          '.viz-u-mgup-sm > .md-card-header > .md-card-header-text > .md-layout-item_para_fl'
        )
        .exists()
    ).toBeTruthy()
    expect(
      wrapper.find('.viz-u-mgup-sm > .u_margin-top-small').exists()
    ).toBeTruthy()
    expect(
      wrapper.find('.viz-u-mgup-sm.utility-margin.md-theme-default').exists()
    ).toBeTruthy()
    expect(
      wrapper.find('.md-card-header.md-card-header-flex').exists()
    ).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-layout-item_para_fl').text()).toBe(
      'You can view and download your schema here.'
    )
  })

  it('calls downloadJsonSchema method when download schema button is clicked', async () => {
    const downloadSchema = jest.spyOn(wrapper.vm.$store, 'dispatch')
    await wrapper.find('.gallery-item:nth-child(2)').trigger('click')
    expect(downloadSchema).toHaveBeenCalled()
  })

  it('calls publishXml method when publish schema button is clicked', async () => {
    const publishSchema = jest.spyOn(wrapper.vm.$store, 'dispatch')
    await wrapper.find('.gallery-item:nth-child(3)').trigger('click')
    expect(publishSchema).toHaveBeenCalled()
  })

  it('renders all cards', () => {
    expect(wrapper.findAll('.gallery-item').length).toBe(3)
  })

  it('renders correct text for each card', () => {
    const galleryItems = wrapper.findAll('.gallery-item')
    const texts = [
      'View your schema in a json format directly from the web.',
      'Download your schema in a XSD format to your local machine.',
      'Publish your schema in an XSD format'
    ]
    galleryItems.wrappers.forEach((item, index) => {
      expect(item.find('.md-layout-item_para').text()).toBe(texts[index])
    })
  })

  it('maps getters and actions correctly', () => {
    expect(wrapper.vm.token).toBe(null)
    expect(wrapper.vm.downloadJsonSchema).toBeDefined()
    expect(wrapper.vm.publishSchema).toBeDefined()
  })
})
