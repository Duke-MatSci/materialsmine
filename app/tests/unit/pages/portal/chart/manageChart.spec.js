import createWrapper from '../../../../jest/script/wrapper'
import ManageChart from '@/pages/portal/chart/ManageChart.vue'
import store from '@/store'

const commit = jest.spyOn(store, 'commit').mockImplementation(() => {})

describe('ManageChart.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ManageChart, {}, false)
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', { icon: '', name: 'Manage Chart' })
  })

  it('renders layout', () => {
    expect(wrapper.find('.viz-u-mgup-sm > .md-card-header > .md-card-header-text > .md-body-1').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm > .u_margin-top-small').exists()).toBeTruthy()
    expect(wrapper.find('.viz-u-mgup-sm.utility-margin.md-theme-default').exists()).toBeTruthy()
    expect(wrapper.find('.md-card-header.md-card-header-flex').exists()).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-body-1').text()).toBe('This task requires admin priviledges. Admin users are allowed to backup and restore charts')
  })
})
