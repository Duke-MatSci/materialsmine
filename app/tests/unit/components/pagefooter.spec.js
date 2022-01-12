import { mount } from '@vue/test-utils'
import PageFooter from '@/components/PageFooter.vue'
import router from '@/router/index.js'

const factory = () => {
  return mount(PageFooter, {
    router
  })
}
function findComponentByText (wrapperArray) {
  return {
    hasText: (inputString) => wrapperArray.filter(i => i.text().match(inputString))
  }
}
describe('PageFooter.vue', () => {
  it('redirects to home on logo click', async () => {
    const wrapper = factory()
    wrapper.vm.$router.push('/testroute')
    const logo = wrapper.findComponent('.footer_icon-img')
    await logo.trigger('click')
    expect(wrapper.vm.$route.path).toEqual('/')
  })
  it('contains link to privacy policy', async () => {
    const wrapper = factory()
    const privacyPolicy = findComponentByText(wrapper.findAll('a')).hasText('Privacy').at(0)
    expect(privacyPolicy.attributes('href')).toBe('https://oarc.duke.edu/privacy/duke-university-privacy-statement')
  })
  it('contains link to terms of use', async () => {
    const wrapper = factory()
    const termsofuse = findComponentByText(wrapper.findAll('a')).hasText('Terms').at(0)
    expect(termsofuse.attributes('href')).toBe('https://security.duke.edu/node/82')
  })
})
