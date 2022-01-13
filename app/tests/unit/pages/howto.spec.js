import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import HowTo from '@/pages/howTo/HowTo.vue'
import store from '@/store'

const localVue = createLocalVue()
localVue.use(Vuex)

beforeAll(() => {
  jest.resetModules()
})

describe('HowTo.vue', () => {
  it('mounts properly', () => {
    const wrapper = shallowMount(HowTo, { store, localVue })
    expect(wrapper.exists()).toBeTruthy()
  })
})
