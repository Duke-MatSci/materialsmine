import createWrapper from '../../../jest/script/wrapper'
import ImageDetailView from '@/pages/explorer/image/ImageDetailView.vue'

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
      },
      {
        file: '/api/files/583e05cfe74a1d205f4e2155',
        description: 'Test Image description',
        microscopyType: 'AFM',
        type: 'grayscale',
        dimension: {
          width: 40,
          height: 30
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

const fileId = '/api/files/583e05cfe74a1d205f4e2177'

const mockMethods = jest.fn()

describe('ImageDetailView.vue', () => {
  let wrapper
  beforeAll(async () => {
    wrapper = await createWrapper(ImageDetailView, {
      mocks: {
        $apollo: {
          loading: false
        }
      }
    }, true)
    await wrapper.setData({ getSingleImages: apollo.images })
    wrapper.vm.$route.params.fileId = fileId
    await wrapper.vm.setCurrentImage(apollo.images)
  })

  it('loads page container div', () => {
    expect.assertions(1)
    expect(wrapper.find('.image-detail-page').exists()).toBe(true)
  })

  it('sets fileId based on route param value', () => {
    expect.assertions(1)
    expect(wrapper.vm.$route.params.fileId).toEqual(fileId)
  })

  it('loads and call navs', async () => {
    wrapper.setMethods({ navBack: mockMethods, handleShare: mockMethods })
    expect.assertions(3)
    expect(wrapper.find('.utility-roverflow').exists()).toBe(true)
    await wrapper.find('#navbackBtn').trigger('click')
    expect(mockMethods).toHaveBeenCalled()
    await wrapper.find('#shareChartBtn').trigger('click')
    expect(mockMethods).toHaveBeenCalled()
  })

  it('renders current image title', () => {
    const currentImageDiv = wrapper.find('.md-card')
    expect(currentImageDiv.find('.md-title').text()).toContain('height image')
    expect(currentImageDiv.find('.md-subhead').text()).toContain('Morphology and electrical resistivity o')
  })

  it('routes to article when "view article" is clicked', async () => {
    const viewArticle = wrapper.find('.u--b-rad')
    expect(viewArticle.text()).toContain('10.1016/j.polymer.2003.10.003')
    await viewArticle.trigger('click')
    expect(wrapper.vm.$route.path).toBe('/explorer/article/10.1016/j.polymer.2003.10.003')
  })

  it('renders three tabs sections', async () => {
    expect.assertions(1)
    expect(wrapper.findAll('.u--margin-rightmd').length).toEqual(4)
  })

  it('shows metadata', () => {
    expect(wrapper.find('#microscropy').text()).toBe('AFM')
  })

  it('renders related images', async () => {
    expect(wrapper.findAll('.md-card-class').length).toEqual(1)
  })

  it('render error page on empty result', async () => {
    await wrapper.setData({ getSingleImages: undefined })
    expect(wrapper.find('.visualize_header-h1').text()).toBe('Cannot Load Images!!!')
  })
})
