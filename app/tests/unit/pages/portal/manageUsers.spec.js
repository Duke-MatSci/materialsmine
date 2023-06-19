import createWrapper from '../../../jest/script/wrapper'
import ManageUsers from '@/pages/portal/ManageUsers.vue'
import store from '@/store'

const created = jest.spyOn(store, 'commit').mockImplementation(() => {})
const data = {
  totalItems: 1,
  pageSize: 10,
  pageNumber: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  data: [
    {
      _id: '648adaf0aa54ee0f0b1750e7',
      alias: null,
      givenName: 'Test',
      surName: 'Testing',
      displayName: 'Tester',
      email: 'testuser@nodomain.org',
      apiAccess: null,
      __typename: 'User'
    }
  ],
  __typename: 'Users'
}

describe('ManageUsers.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ManageUsers, {
      mocks: {
        $apollo: {
          loading: false,
          queries: {
            users: {
              refetch: jest.fn()
            }
          }
        }
      }
    }, false)
    await wrapper.setData({ users: data })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('page mounts properly', () => {
    expect.assertions(2)
    expect(wrapper.exists()).toBeTruthy()
    expect(created).toHaveBeenCalledWith('setAppHeaderInfo', { icon: '', name: '' })
  })

  it('renders components properly', () => {
    expect.assertions(2)
    expect(wrapper.findComponent({ name: 'pagination' }).exists()).toBeTruthy()
    expect(wrapper.findComponent({ name: 'Dialog' }).exists()).toBeTruthy()
  })

  it('renders table if users data is provided', async () => {
    expect.assertions(2)
    expect(wrapper.findComponent('md-table-stub').exists()).toBeTruthy()
    await wrapper.setData({ users: {} })
    expect(wrapper.findComponent('md-table-stub').exists()).toBe(false)
  })

  it('renders table toolbar correctly', async () => {
    await wrapper.setData({ users: data })
    const table = wrapper.findComponent('md-table-stub')
    const toolbar = table.findComponent('md-table-toolbar-stub')
    const searchBar = toolbar.findComponent('md-field-stub')
    expect(toolbar.find('.md-toolbar-section-start > h1.md-title').exists()).toBeTruthy()
    expect(toolbar.find('.md-toolbar-section-start > h1.md-title').text()).toBe('Manage Users')
    expect(searchBar.exists()).toBe(true)
    expect(searchBar.attributes().class).toBe('md-toolbar-section-end')
    expect(searchBar.findComponent('md-input-stub').attributes().placeholder).toBe('Search by display name...')
  })

  it('renders table empty state correctly', async () => {
    const table = wrapper.findComponent('md-table-stub')
    const emptyContainer = table.findComponent('md-table-empty-state-stub')
    expect(emptyContainer.exists()).toBeTruthy()
    expect(emptyContainer.attributes().mddescription).toContain(`No user found for this '${wrapper.vm.search}' query. Try a different search term or create a new user.`)
  })

  it('renders update user form conditionally', async () => {
    expect(wrapper.find('.article_citations').exists()).toBe(false)
    expect(wrapper.vm.updateMode).toBe(false)
    await wrapper.setData({ selected: data.data })
    // show form
    await wrapper.vm.showUpdateForm()
    expect(wrapper.vm.updateMode).toBe(true)
    expect(wrapper.find('.article_citations').exists()).toBe(true)
    // hide form
    await wrapper.vm.closeUpdateForm()
    expect(wrapper.find('.article_citations').exists()).toBe(false)
    expect(wrapper.vm.updateMode).toBe(false)
  })

  it('renders update user form properly', async () => {
    await wrapper.setData({ selected: data.data })
    await wrapper.vm.showUpdateForm()
    const formContainer = wrapper.find('.article_citations')
    expect(wrapper.vm.updateMode).toBe(true)
    // header
    expect(formContainer.find('h2.md-title.u--color-black').text()).toBe('Update User')
    // form
    expect(formContainer.find('form.md-card-header').exists()).toBe(true)
    // form direct children
    expect(formContainer.find('form > .md-layout.md-gutter.viz-u-mgbottom-big').exists()).toBe(true)
    expect(formContainer.find('form > ul.contactus_radios').exists()).toBe(true)
    // input container
    expect(formContainer.findAll('form > .md-layout > .md-layout-item').length).toBe(2)
  })

  it('renders update user form inputs properly', async () => {
    const label = ['Firstname', 'Lastname']
    await wrapper.setData({ selected: data.data })
    await wrapper.vm.showUpdateForm()
    const formContainer = wrapper.find('.article_citations')
    const inputContainer = formContainer.findAll('form > .md-layout > .md-layout-item')
    for (let i = 0; i < inputContainer.length; i++) {
      expect(inputContainer.at(i).attributes().class).toBe('md-layout-item md-size-50 md-xsmall-size-100 md-gutter u_margin-top-small')
      expect(inputContainer.at(i).findComponent('md-field-stub').exists()).toBe(true)
      expect(inputContainer.at(i).findComponent('md-input-stub').exists()).toBe(true)
      expect(inputContainer.at(i).find('label').text()).toBe(label[i])
    }
  })

  it('renders update user form radio buttons properly', async () => {
    const label = ['Admin', 'Member']
    await wrapper.setData({ selected: data.data })
    await wrapper.vm.showUpdateForm()
    const formContainer = wrapper.find('.article_citations')
    const lists = formContainer.findAll('ul.contactus_radios > li')
    for (let i = 0; i < lists.length; i++) {
      expect(lists.at(i).find('div.form__radio-group > input.form__radio-input').attributes().type).toBe('radio')
      expect(lists.at(i).find('div.form__radio-group > label.form__radio-label').text()).toBe(label[i])
      expect(lists.at(i).find('div.form__radio-group > label.form__radio-label > span').attributes('class')).toBe('form__radio-button')
    }
  })

  it.skip('renders update user form buttons properly', async () => {
    const label = ['CANCEL', 'Submit']
    await wrapper.setData({ selected: data.data })
    await wrapper.vm.showUpdateForm()
    const formContainer = wrapper.find('.article_citations')
    const buttons = formContainer.findAll('div.md-card-actions.md-alignment-right > button')
    expect(buttons.at(0).attributes().class).toBe('md-button btn btn--tertiary btn--noradius')
    expect(buttons.at(0).find('span').attributes().class).toBe('md-caption')
    expect(buttons.at(1).attributes().class).toBe('md-button btn btn--primary btn--noradius')
    expect(buttons.at(1).find('span').attributes().class).toBe('md-caption u--bg')
    for (let i = 0; i < buttons.length; i++) {
      expect(buttons.at(i).find('span').text()).toBe(label[i])
    }
  })
})
