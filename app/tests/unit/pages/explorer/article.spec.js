import { shallowMount, createLocalVue } from '@vue/test-utils'

import Article from '@/pages/explorer/article/Article.vue'
import articleMetadata from '@/modules/explorer/article/services/articleMetadata'
jest.mock('@/modules/explorer/article/services/articleMetadata')

const localVue = createLocalVue()

var wrapper = null

const $route = {
  params: {
    doi: '10.1063/1.5046839'
  }
}

afterEach(() => {
  articleMetadata.__reset()
  articleMetadata.get.mockClear()
})

describe('Article.vue', () => {
  beforeAll(done => {
    try {
      wrapper = mountArticle()
      done()
    } catch (error) {
      done(error)
    }
  })

  it('loads DOI', () => {
    const doiWrapper = wrapper.find('.article_doi')
    expect(doiWrapper.text()).toMatch(new RegExp($route.params.doi))
  })

  it('displays provided data', () => {
    expect(wrapper.vm.loading).toBeFalsy()
    const titleWrapper = wrapper.find('.article_title')
    expect(titleWrapper.exists()).toBeTruthy()
    expect(titleWrapper.text()).toMatch(/NanoMine schema/)
  })

  it('updates when passed a new DOI', async () => {
    await localVue.nextTick() // ensures all previous async calls are complete
    wrapper.vm.$route.params.doi = '10.1002%2Fpolb.20925'
    await localVue.nextTick() // gives vue time to update wrapper.vm.doi
    expect(wrapper.vm.doi).toBe('10.1002%2Fpolb.20925')
    expect(articleMetadata.get.mock.calls.length).toBe(1)
  })
})

describe('Article.vue', () => {
  it('handles data promise rejection', async () => {
    articleMetadata.__setTestingData(false)
    articleMetadata.__setTestingRejection(true)
    wrapper = mountArticle()
    await localVue.nextTick()
    expect(wrapper.vm.error).toBeTruthy()
    expect(wrapper.vm.loading).toBeFalsy()
  })
})

function mountArticle () {
  return shallowMount(Article, {
    localVue,
    mocks: {
      $route
    }
  })
}
