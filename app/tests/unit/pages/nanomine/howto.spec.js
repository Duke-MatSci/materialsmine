import createWrapper from '../../../jest/script/wrapper'
import HowTo from '@/pages/nanomine/howTo/HowTo.vue'

var wrapper = null
// suppress jsdom alert 'Not implemented window.open'
window.open = jest.fn()
window.open.mockClear()
global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

describe('HowTo.vue', () => {
  beforeAll(async () => {
    wrapper = createWrapper(HowTo, {})
    await wrapper.vm.$nextTick()
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('hides all videos to start', () => {
    expect(wrapper.find('#videoPlayerContainer').exists()).toBeFalsy()
  })

  it('displays video on first click, hides it on second click', async () => {
    const videoTitle = wrapper.find('.howto_item .howto_item-header')
    expect(videoTitle.exists()).toBeTruthy()

    await videoTitle.trigger('click')
    expect(wrapper.find('video').exists()).toBeTruthy()

    await videoTitle.trigger('click')
    expect(wrapper.find('video').exists()).toBeFalsy()
  })

  it('closes any other open videos when a new one is clicked', async () => {
    const videoTitle = wrapper.findAll('.howto_item .howto_item-header')

    await videoTitle.at(0).trigger('click')
    expect(wrapper.findAll('video').length).toEqual(1)

    await videoTitle.at(1).trigger('click')
    expect(wrapper.findAll('video').length).toEqual(1)
  })

  it('correctly opens a link if passed one', async () => {
    const videoIcons = wrapper.findAll('.material-icons')

    if (videoIcons.exists()) {
      for (const videoIcon of videoIcons.wrappers) {
        if (videoIcon.text().indexOf('smart_display') !== -1) {
          await videoIcon.trigger('click')
          expect(window.open.mock.calls.length).toBeGreaterThanOrEqual(1)
          expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).not.toBeNull()
        }
      }
    }
  })
})
