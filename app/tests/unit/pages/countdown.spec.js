import createWrapper from '../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import CountDown from '@/pages/CountDown.vue'

const mounted = jest.spyOn(CountDown.methods, 'getDate').mockImplementation(() => {})
describe('CountDown.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(CountDown, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('mounts properly', () => {
    expect(wrapper.find('.countdown-page').exists()).toBe(true)
    expect(mounted).toHaveBeenCalledTimes(1)
  })

  it('render page layout properly', () => {
    expect.assertions(2)
    expect(wrapper.find('.countdown-page > .section_banner > .editImage_modal').exists()).toBe(true)
    expect(wrapper.find('.editImage_modal > .metamine_intro-content').exists()).toBe(true)
  })

  it('render header text properly', () => {
    expect.assertions(2)
    const header = wrapper.find('.search_box_header.u_centralize_text.u_color_white.u_margin-top-small')
    expect(header.exists()).toBe(true)
    expect(header.text()).toBe('We Are Coming Very Soon!')
  })

  it('render image properly', () => {
    expect.assertions(3)
    const imageContainer = wrapper.find('.header-logo.u--margin-none.u_margin-top-med')
    const image = imageContainer.find('img')
    const span = imageContainer.find('span.md-title')
    expect(image.attributes().src).toBe('@/assets/img/materialsmine_logo_sm.png')
    expect(image.attributes().id).toBe('logo')
    expect(span.exists()).toBe(true)
  })

  it('render clock box elements properly', () => {
    expect.assertions(3)
    const clockBox = wrapper.find('.clock__box.u_margin-right-small')
    const clockHeader = clockBox.find('h1')
    const clockText = clockBox.find('p')
    expect(clockBox.exists()).toBe(true)
    expect(clockHeader.attributes().class).toBe('visualize_header-h1 article_title u_centralize_text')
    expect(clockText.attributes().class).toBe('u_centralize_text p_mobile_small')
  })

  it('render correct no of clock box ', () => {
    expect.assertions(9)
    const clockBox = wrapper.findAll('.clock__box.u_margin-right-small')
    expect(clockBox.length).toBe(4)
    for (let i = 0; i < clockBox.length; i++) {
      expect(clockBox.at(i).find('h1').exists()).toBe(true)
      expect(clockBox.at(i).find('p').exists()).toBe(true)
    }
  })

  it('render correct clock box in the right order', () => {
    expect.assertions(4)
    const arr = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS']
    const clockText = wrapper.findAll('.u_centralize_text.p_mobile_small')
    for (let i = 0; i < clockText.length; i++) {
      expect(clockText.at(i).text()).toBe(arr[i])
    }
  })

  it('render notify text', () => {
    expect.assertions(1)
    expect(wrapper.find('.u_color_white.u--margin-toplg').text()).toBe("Notify me when it's ready")
  })

  it('render form layout', () => {
    expect.assertions(3)
    const form = wrapper.find('form')
    const inputContainer = form.find('.search_box_form > .search_box_form-item-1')
    const buttonContainer = form.find('.search_box_form > .search_box_form-item-2')
    expect(inputContainer.exists()).toBe(true)
    expect(buttonContainer.exists()).toBe(true)
    expect(form.findAll('.form__group').length).toBe(2)
  })

  it('render button properly', () => {
    expect.assertions(2)
    const button = wrapper.find('button')
    expect(button.attributes().class).toBe('btn btn--primary btn--tertiary btn--noradius search_box_form_btn submit_button')
    expect(button.text()).toBe('Submit')
  })

  it('render form correctly', async () => {
    expect.assertions(7)
    const onSubmit = jest.spyOn(wrapper.vm, 'onSubmit').mockImplementation(() => {})
    const form = wrapper.find('form')
    const input = form.find('#search')
    expect(input.attributes().type).toBe('email')
    expect(input.attributes().class).toBe('form__input form__input--adjust')
    expect(input.attributes().placeholder).toBe('Get notified by email.')
    expect(input.attributes().required).toBe('required')
    expect(form.find('label').attributes().class).toBe('form__label search_box_form_label')

    await input.setValue('my@mail.com')
    expect(wrapper.vm.email).toBe('my@mail.com')
    form.trigger('submit')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
