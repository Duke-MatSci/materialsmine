import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ImageGallery from '@/pages/explorer/image/Image.vue'

const apollo = {
  images: {
    totalItems: 1,
    pageSize: 1,
    pageNumber: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: true,
    images: [
      {
        file: '/api/files/583e05cfe74a1d205f4e2177',
        description: 'height image',
        microscopyType: 'AFM',
        type: 'grayscale',
        dimension: {
          width: 20,
          height: 20
        },
        metaData: {
          title: 'Morphology and electrical resistivity of melt mixed blends of polyethylene and carbon nanotube filled polycarbonate',
          doi: '10.1016/j.polymer.2003.10.003',
          id: '583e0672e74a1d205f4e21be',
          keywords: [
            'Blends',
            'Multiwalled carbon nanotube composites',
            'Electrical resistivity'
          ]
        }
      }
    ]
  }
}
describe('Image.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ImageGallery, {
      mocks: {
        $apollo: {
          loading: false
        }
      }
    }, true)
    await wrapper.setData({ images: apollo.images })
  })

  enableAutoDestroy(afterEach)

  // TODO: TEST
  it('loads page', async () => {
    expect.assertions(1)
    expect(await wrapper.find('.gallery').exists()).toBe(true)
  })

  it('shows number of results', async () => {
    expect.assertions(2)
    expect(await wrapper.find('.utility-roverflow').exists()).toBe(true)
    expect(await wrapper.find('.u_content__result').text()).toMatch(
      /[1-9]\d* result/
    )
  })

  it('provides links for each result', async () => {
    const images = wrapper.vm.images.images
    expect.assertions(images.length)
    for (const [idx, image] of images.entries()) {
      expect(
        await wrapper.findAllComponents(RouterLinkStub).at(idx).props().to
      ).toEqual({
        name: 'ImageDetailView',
        params: { id: image.metaData.id, fileId: image.file }
      })
    }
  })
})
