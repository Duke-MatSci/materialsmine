import createWrapper from '../../../jest/script/wrapper'
import ContactCard from '@/components/portal/ContactCard.vue'

var wrapper = null

describe('ToolCard.vue', () => {
  const data = {
    _id: '637f4d5f1cfe9f86ea5c3231',
    fullName: 'Sample doe',
    email: 'sample@email.com',
    purpose: 'TICKET',
    message: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur',
    resolved: false
  }
  beforeEach(async () => {
    wrapper = createWrapper(ContactCard, {
      props: {
        contact: data
      }
    }, false)
  })

  it('mounts properly', () => {
    expect.assertions(5)
    expect(wrapper.exists()).toBeTruthy()
    expect(wrapper.find('.gallery-item.results_card').exists()).toBeTruthy()
    expect(wrapper.findComponent('md-card-header-stub').exists()).toBeTruthy()
    expect(wrapper.find('.results_card-title.md-body-2').exists()).toBeTruthy()
    expect(wrapper.find('.dialog-box_actions').exists()).toBeTruthy()
  })

  it('renders buttons properly', () => {
    expect.assertions(1)
    expect(wrapper.findAll('button').length).toBe(2)
  })

  it('expands when the show button is clicked ', async () => {
    expect.assertions(6)
    expect(wrapper.vm.show).toBe(true)
    expect(wrapper.findAll('.md-layout').length).toBe(2)
    expect(wrapper.findAll('.results_card-type').length).toBe(2)
    expect(wrapper.findAll('.results_card-type').at(0).html()).toContain(data.email)
    expect(wrapper.findAll('.results_card-type').at(1).html()).toContain(data.purpose)
    expect(wrapper.find('.article_metadata.u--color-secondary.utility-line-height-sm').html()).toContain(data.message)
  })

  it('calls the right method when the hide button is clicked ', async () => {
    expect.assertions(1)
    const method = jest.spyOn(wrapper.vm, 'hideInquiry').mockImplementation(() => {})
    await wrapper.findAll('button').at(0).trigger('click')
    expect(method).toHaveBeenCalledTimes(1)
  })

  it('calls the right action when Reply button is clicked ', async () => {
    expect.assertions(2)
    const action = jest.spyOn(wrapper.vm.$store, 'dispatch').mockImplementation(() => {})
    await wrapper.findAll('button').at(1).trigger('click')
    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith('contact/renderDialog', data._id)
  })
})
