import { mount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
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
    const wrapper = mount(HowTo, { store, localVue })
    expect(wrapper.exists()).toBeTruthy()
  })

  it('hides all videos to start', () => {
    const wrapper = mount(HowTo, { store, localVue })
    expect(wrapper.find('#videoPlayerContainer').exists()).toBeFalsy()
  })

  it('displays video on first click, hides it on second click', async () => {
    // suppress jsdom alert 'Not implemented window.open'
    window.open = jest.fn()
    window.open.mockClear()

    const wrapper = mount(HowTo, { store, localVue })
    await Vue.nextTick() // wait for videos to load

    const videoTitle = wrapper.find('.howto_item .howto_item-header')
    expect(videoTitle.exists()).toBeTruthy()

    await videoTitle.trigger('click')
    expect(wrapper.find('#videoPlayerContainer').exists()).toBeTruthy()

    await videoTitle.trigger('click')
    expect(wrapper.find('#videoPlayerContainer').exists()).toBeFalsy()
  })

  it('closes any other open videos when a new one is clicked', async () => {
    // suppress jsdom alert 'Not implemented window.open'
    window.open = jest.fn()
    window.open.mockClear()

    const wrapper = mount(HowTo, { store, localVue })
    await Vue.nextTick() // wait for videos to load

    const videoTitle = wrapper.findAll('.howto_item .howto_item-header')

    await videoTitle.at(0).trigger('click')
    expect(wrapper.findAll('#videoPlayerContainer').length).toEqual(1)

    await videoTitle.at(1).trigger('click')
    expect(wrapper.findAll('#videoPlayerContainer').length).toEqual(1)
  })
})
