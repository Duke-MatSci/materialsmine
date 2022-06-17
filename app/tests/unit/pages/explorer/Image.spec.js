import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ImageGallery from '@/pages/explorer/image/Image.vue'
import { chartUriPrefix } from '@/modules/vega-chart'

import { loadJsonView } from '@/modules/whyis-view'
jest.mock('@/modules/whyis-view')
loadJsonView.mockImplementation(() => {
  return [...Array(333).keys()].map((i) => ({
    identifier: `${chartUriPrefix}gallery_item_${i}`,
    label: `Gallery Item #${i}: a label`,
    description: `this text describes Gallery Item #${i}`
  }))
})

describe('Image.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ImageGallery, {}, true)
  })

  enableAutoDestroy(afterEach)

  it('loads images page', () => {
    const imgGalleryGrid = wrapper.find('.gallery-grid')
    expect(imgGalleryGrid.exists()).toBe(true)
  })

  it('loads placeholder images', () => {
    const plchldrImg = wrapper.find('img')
    expect(plchldrImg.exists).toBe(true)
  })
})
