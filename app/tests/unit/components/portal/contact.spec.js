import createWrapper from '../../../jest/script/wrapper'
import ContactBox from '@/components/portal/Contact.vue'
let wrapper
const data = {
  _id: '637f4d5f1cfe9f86ea5c3231',
  fullName: 'Sample doe',
  email: 'sample@email.com',
  purpose: 'TICKET',
  message: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur'
}

describe('PageHeader.vue', () => {
  beforeEach(async () => {
    wrapper = createWrapper(ContactBox, {
      props: {
        contact: data
      }
    }, false)
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('mounts properly', () => {
    expect.assertions(1)
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders the proper layout', () => {
    const mainContainer = wrapper.find('div > .btn--animated > .md-card-actions ')
    expect(mainContainer.exists()).toBeTruthy()
    expect(mainContainer.find('.contact__box-email').exists()).toBeTruthy()
    expect(mainContainer.find('.md-layout').exists()).toBeTruthy()
    expect(mainContainer.findComponent('md-dialog-actions-stub').exists()).toBeTruthy()
  })

  it('renders email correctly from the contact props', () => {
    const email = wrapper.find('.contact__box-email')
    expect(email.exists()).toBeTruthy()
    expect(email.attributes().class).toBe('contact__box-email results_card-title md-body-2 u--color-black utility-roverflow')
    expect(email.text()).toBe(data.email)
  })

  it('renders text properly with the right method ', () => {
    const textContainer = wrapper.find('.md-layout > .utility-line-height-sm.teams_header')
    expect(textContainer.exists()).toBeTruthy()
    expect(textContainer.find('p')).toBeTruthy()
    expect(wrapper.findAll('p').length).toBe(1)
    expect(wrapper.find('p').attributes().class).toBe('md-body-1 u--color-secondary')
    expect(wrapper.find('p').text()).toBe(wrapper.vm.shortMessage.trim())
  })

  it('renders the button', () => {
    const buttonContainer = wrapper.findComponent('md-dialog-actions-stub')
    const button = buttonContainer.find('button')
    expect(buttonContainer.exists()).toBeTruthy()
    expect(buttonContainer.attributes().class).toBe('u--padding-zero')
    expect(button.exists()).toBeTruthy()
    expect(button.attributes().class).toBe('btn btn--white md-body-1 u--shadow-none btn--noradius')
    expect(button.text()).toBe('Read')
  })

  it('calls the right method when button is clicked', async () => {
    const method = jest.spyOn(wrapper.vm, 'displayInquiry').mockImplementation(() => {})
    await wrapper.find('button').trigger('click')
    expect(method).toHaveBeenCalledTimes(1)
  })

  it('shortMessage calls the right method', async () => {
    const shortMessage = await wrapper.vm.shortMessage
    expect(shortMessage).toBe(wrapper.vm.reduceDescription(data.message, 3))
  })

  it('displayInquiry calls the right mutation', async () => {
    const mutation = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    await wrapper.vm.displayInquiry()
    expect(mutation).toHaveBeenCalledTimes(1)
    expect(mutation).toHaveBeenCalledWith('contact/setDisplayedInquiry', data)
  })
})
