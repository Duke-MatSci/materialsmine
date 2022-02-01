import { shallowMount, createLocalVue } from '@vue/test-utils'

import Article from '@/pages/explorer/article/Article.vue'
jest.mock('@/modules/explorer/article/services/getArticleMetadata')

const localVue = createLocalVue()

describe('Article.vue', () => {
  var wrapper = null
  var mockRoute = {
    params: {
      doi: '10.1002%2Fpolb.20925'
    }
  }

  beforeAll(() => {
    wrapper = shallowMount(Article, {
      localVue,
      mocks: {
        $route: mockRoute
      }
    })
  })

  it('loads DOI when given one', () => {
    expect(wrapper.vm.doi).toEqual(mockRoute.params.doi)
  })

  it('displays provided data', () => {
    const titleWrapper = wrapper.find('.article_title')
    expect(titleWrapper.exists()).toBeTruthy()
    expect(titleWrapper.text()).toMatch(/NanoMine schema/)
  })
})
