import createWrapper from '../../../jest/script/wrapper'
import PixelUnit from '@/pages/metamine/PixelUnit/PixelUnit.vue'

// TODO handle config file loading once it has a location

// import { promises } from 'fs'

var wrapper = null

describe('PixelUnit.vue', () => {
  beforeAll(async () => {
    // const configData = await promises.readFile('@/assets/lin-bilal-liu-10x10-c4v-15bit-static-dynamic.txt', { encoding: 'utf-8' })
    global.fetch.mockReturnValueOnce(Promise.resolve({
      text: () => '' // configData
    }))
    wrapper = createWrapper(PixelUnit, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO once config file situated, uncomment this test
  // it('responds to clicks', () => {
  //   const grid = wrapper.find('#unit-cell')
  //   grid.trigger('click', { layerX: 15, layerY: 15 })
  //   expect(wrapper.vm.geometryItems[0].value).toBe('000000000000001')
  // })
})
