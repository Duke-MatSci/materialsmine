import createWrapper from '../../../jest/script/wrapper'
import ContactUsPage from '@/pages/nanomine/contactus/ContactUs.vue'

describe('ContactUsPage.vue', () => {
  let wrapper
  beforeAll(() => {
    wrapper = createWrapper(ContactUsPage, {})
  })

  it('page mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders the contact us form', () => {
    const form = wrapper.findComponent('form')
    expect(form.exists()).toBeTruthy()
  })

  it('renders the name input', () => {
    const nameInput = wrapper.findComponent('#name')
    expect(nameInput.exists()).toBeTruthy()
  })

  it('renders the email input', () => {
    const emailInput = wrapper.findComponent('#email')
    expect(emailInput.exists()).toBeTruthy()
  })

  it('renders the message input', () => {
    const messageInput = wrapper.findComponent('#message')
    expect(messageInput.exists()).toBeTruthy()
  })

  it('render user inputs on change', async () => {
    await wrapper.setData({
      name: 'test name',
      email: 'kzunigac@uvm.edu',
      message: 'test message',
      platform: 'nanomine'
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent('#name').element.value).toBe('test name')
    expect(wrapper.findComponent('#message').element.value).toBe('test message')
    expect(wrapper.findComponent('#email').element.value).toBe('kzunigac@uvm.edu')
    expect(wrapper.findComponent('#nanomine').element.value).toBe('nanomine')
  })
})
