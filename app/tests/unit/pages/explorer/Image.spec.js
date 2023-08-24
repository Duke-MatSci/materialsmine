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
          loading: false,
          queries: {
            images: {
              refetch: jest.fn()
            },
            searchImages: {
              refetch: jest.fn()
            }
          }
        }
      }
    }, false)
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
    expect(await wrapper.find('#css-adjust-navfont > span').text()).toMatch(
      /[1-9]\d*|No result/
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

  it('limits result to page size', async () => {
    expect.assertions(1)
    await wrapper.setData({ pageSize: 5 })
    expect(wrapper.vm.images.images.length).toBeLessThanOrEqual(wrapper.vm.pageSize)
  })

  it('renders image title and description', () => {
    expect.assertions(6)
    const image = wrapper.find('.gallery-item')
    expect(image.exists()).toBe(true)
    expect(image.html()).toContain('Morphology and electrical')
    expect(image.find('.md-subheading').exists()).toBe(true)
    expect(image.find('.md-subheading').text()).not.toBe('')
    expect(image.find('.md-body-1').exists()).toBe(true)
    expect(image.find('.md-body-1').text()).not.toBe('')
  })

  it('mounts pagination component with the right parameters and calls the right method', async () => {
    expect.assertions(3)
    var spy = jest.spyOn(wrapper.vm, 'loadPrevNextImage').mockImplementation(() => {})
    const pagination = wrapper.findComponent('pagination-stub')
    expect(pagination.exists()).toBe(true)
    expect(pagination.props().cpage).toBe(wrapper.vm.pageNumber)
    await pagination.vm.$emit('go-to-page', 1)
    expect(spy).toHaveBeenCalledWith(1)
  })

  it('renders searchbox', () => {
    expect(wrapper.find('.search_box').exists()).toBe(true)
    expect(wrapper.find('.search_box').html()).toContain('filter')
    const searchBtn = wrapper.findAll('button').at(0)
    expect(searchBtn.text()).toBe('Search Images')
  })

  it('renders the right text when response empty', async () => {
    var expectedString = 'Sorry! No Image Found'
    const emptyData = apollo.images
    emptyData.images = []
    emptyData.totalItems = 0
    await wrapper.setData({ images: emptyData })
    expect(wrapper.find('.gallery-item').exists()).toBe(false)
    expect(wrapper.find('.utility-roverflow.u_centralize_text.u_margin-top-med').exists()).toBe(true)
    expect(wrapper.find('h1.visualize_header-h1.u_margin-top-med').text()).toBe(expectedString)
  })
})
