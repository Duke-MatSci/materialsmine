import createWrapper from '../../../../jest/script/wrapper'
import ContactInquiry from '@/pages/portal/enquiries/ContactInquiry.vue'

describe('ContactUsPage.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ContactInquiry, {
      stubs: {
        MdField: { template: '<span><slot/></span>' },
        MdTextArea: { template: '<textarea><slot/></textarea>' }
      }
    }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('page mounts properly', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders components properly', () => {
    expect.assertions(2)
    expect(wrapper.findComponent({ name: 'pagination' }).exists()).toBeTruthy()
    expect(wrapper.findComponent({ name: 'Dialog' }).exists()).toBeTruthy()
  })

  it('renders contact card component conditionally', async () => {
    expect.assertions(1)
    const data = [
      {
        _id: '637f4d5f1cfe9f86ea5c3231',
        fullName: 'jane doe',
        email: 'sample@email.com'
      },
      {
        _id: '637f4d5f1cfe9f86ea5c3231',
        fullName: 'jane doe',
        email: 'sample@email.com'
      }
    ]
    await wrapper.vm.$store.commit('contact/setContactInquiries', data)
    expect(wrapper.findAllComponents({ name: 'ContactBox' }).length).toBe(data.length)
  })

  it('renders spinner component when loading', async () => {
    expect.assertions(1)
    await wrapper.vm.$store.commit('contact/setIsLoading', true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBeTruthy()
  })

  it('renders empty state if no data is gotten', async () => {
    expect.assertions(2)
    await wrapper.vm.$store.commit('contact/setContactInquiries', [])
    await wrapper.vm.$store.commit('contact/setIsLoading', false)
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med > .visualize_header-h1').exists()).toBeTruthy()
    expect(wrapper.find('.visualize_header-h1').html()).toContain('No Available Inquiries!!!')
  })
})
