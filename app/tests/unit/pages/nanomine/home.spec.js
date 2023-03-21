import { mount } from '@vue/test-utils'
import Home from '@/pages/nanomine/Home/Home.vue'
import router from '@/router/index.js'

const factory = async (info = {}) => {
  return mount(Home, {
    router,
    data () {
      return {
        assetItems: []
      }
    },
    mocks: {
      $store: {
        commit: () => {
          return {
            setAppHeaderInfo: info
          }
        },
        getters: () => ({
          countDownDate: new Date('Mar 11, 2023 13:30:00').getTime() // Using past time to ensure test run without triggering countdown
        })
      },
      $router: {
        push: jest.fn()
      }
    }
  })
}

describe('Nanomine Homepage', () => {
  it('mount component correctly', async () => {
    const wrapper = await factory()
    await wrapper.setData({ assetItems: [{}, {}, {}, {}] })

    expect(wrapper.find('.visualize_header-h1').exists()).toBe(true)
    expect(wrapper.findAll('.visualize_chart').length).toEqual(4)
    expect(wrapper.find('.visualize_btn').exists()).toBe(true)
    expect(wrapper.find('.section_quicklinks').exists()).toBe(true)
    expect(wrapper.findAll('.quicklinks').length).toEqual(3)
  })

  it('navigates on quicklink clicks', async () => {
    const wrapper = await factory()
    const link = wrapper.find('.quicklinks')
    await link.trigger('click')
    expect(wrapper.vm.$route.path).toEqual('/nm/xml-uploader')
  })
})
