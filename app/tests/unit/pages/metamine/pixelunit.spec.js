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

  it('renders geometry details cards', () => {
    const geometryCard = wrapper.findAll('.md-subheading')

    expect.assertions(5)
    expect(geometryCard.at(1).exists()).toBeTruthy()
    expect(geometryCard.length).toBe(3)
    expect(geometryCard.at(0).text()).toBe('Geometry')
    expect(geometryCard.at(1).text()).toBe("Effective Young's Modulus (Pa)")
    expect(geometryCard.at(2).text()).toBe("Effective Poisson's ratio")
  })

  it('loads initial geometric details correctly', () => {
    expect.assertions(3)
    expect(wrapper.vm.geometryItems[0].value).toBe('000000000000000')
    expect(wrapper.vm.geometryItems[1].value).toBe('N/A')
    expect(wrapper.vm.geometryItems[2].value).toBe('N/A')
  })

  it('responds to clicks', () => {
    const grid = wrapper.find('#unit-cell')

    grid.trigger('click', { layerX: 15, layerY: 15 })
    expect.assertions(4)
    expect(wrapper.vm.geometryItems[0].value).toBe('000000000000001')
    expect(wrapper.vm.geometryItems[1].value).toBe('N/A')
    expect(wrapper.vm.geometryItems[2].value).toBe('N/A')
    grid.trigger('click', { layerX: 15, layerY: 15 })
    expect(wrapper.vm.geometryItems[0].value).toBe('000000000000000')
  })
})
