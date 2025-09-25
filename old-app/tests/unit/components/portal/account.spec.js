import createWrapper from '../../../jest/script/wrapper'
import Account from '@/components/portal/Account.vue'
import store from '@/store'

const commit = jest.spyOn(store, 'commit').mockImplementation(() => {})

describe('Account.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(Account, {}, false)
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
    expect(commit).toHaveBeenCalledWith('setAppHeaderInfo', {
      icon: '',
      name: 'Account Information'
    })
  })

  it('renders layout', () => {
    expect(
      wrapper
        .find('.md-card-header > .md-card-header-text > .md-body-1')
        .exists()
    ).toBeTruthy()
    expect(wrapper.find('.u_margin-top-small').exists()).toBeTruthy()
    expect(wrapper.find('.article_citations').exists()).toBeTruthy()
    expect(
      wrapper.find('.md-card-header.md-card-header-flex').exists()
    ).toBeTruthy()
  })

  it('renders text', () => {
    expect(wrapper.find('.md-body-1').text()).toBe(
      'Here is a summary of your account details'
    )
  })
})
