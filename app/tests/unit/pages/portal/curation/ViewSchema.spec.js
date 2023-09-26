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
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', { icon: '', name: 'View Schema' })
  })

  it('renders layout', () => {
    expect(wrapper.find('.viz-u-mgup-sm > .md-card-header > .md-card-header-text > .md-layout-item_para_fl').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm > .u_margin-top-small').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm.utility-margin.md-theme-default').exists()).toBeTruthy()
    expect(wrapper.find('.md-card-header.md-card-header-flex').exists()).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-layout-item_para_fl').text()).toBe('You can view and download your schema here.')
  })
})
