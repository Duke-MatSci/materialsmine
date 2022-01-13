import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import News from '@/pages/researchnews/News.vue'
import store from '@/store'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('News.vue', () => {
  it('mounts properly', () => {
    const wrapper = mount(News, { store, localVue })
    expect(wrapper.exists()).toBeTruthy()
  })

  it('loads research', () => {
    const wrapper = mount(News, { store, localVue })
    const research = wrapper.findAll('.research')
    expect(research.length).toBeGreaterThanOrEqual(1)
  })

  it('loads news', () => {
    const wrapper = mount(News, { store, localVue })
    const news = wrapper.findAll('.news-container')
    expect(news.length).toBeGreaterThanOrEqual(1)
  })

  // it('loads partners', () => {
  //   const wrapper = mount(News, { store, localVue })
  //   const partner_container = wrapper.get('.team_partner-container')
  //   expect(partner_container.findAll('.teams_partner').length).toBeGreaterThanOrEqual(4)
  // })
})
