import createWrapper from '../../../../jest/script/wrapper'
import ManageCuration from '@/pages/portal/curation/ManageCuration.vue'
import store from '@/store'

const commit = jest.spyOn(store, 'commit').mockImplementation(() => {})

describe('ManageCuration.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ManageCuration, {}, false)
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', { icon: '', name: 'Manage Curation' })
  })

  it('renders layout', () => {
    expect(wrapper.find('.viz-u-mgup-sm > .md-card-header > .md-card-header-text > .md-body-1').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm > .u_margin-top-small').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm.utility-margin.md-theme-default').exists()).toBeTruthy()
    expect(wrapper.find('.md-card-header.md-card-header-flex').exists()).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-body-1').text()).toBe('Administrators can manage curations. The following operations - delete, approve, and update of samples status are allowed')
  })
})
