import createWrapper from '../../../jest/script/wrapper'

import Article from '@/pages/explorer/article/Article.vue'
import articleMetadata from '@/modules/explorer/article/services/articleMetadata'
jest.mock('@/modules/explorer/article/services/articleMetadata')

var wrapper = null

afterEach(() => {
  articleMetadata.__reset()
  articleMetadata.get.mockClear()
})

describe('Article.vue', () => {
  const baseDOI = '10.1063/1.5046839'
  beforeAll(() => {
    wrapper = mountArticle(baseDOI)
  })

  it('loads DOI', () => {
    const doiWrapper = wrapper.find('.article_doi')
    expect(doiWrapper.text()).toMatch(new RegExp(baseDOI))
  })

  it('displays provided data', () => {
    expect(wrapper.vm.loading).toBeFalsy()
    const titleWrapper = wrapper.find('.article_title')
    expect(titleWrapper.exists()).toBeTruthy()
    expect(titleWrapper.text()).toMatch(/NanoMine schema/)
  })

  it('updates when passed a new DOI', async () => {
    const newDOI = '10.1002/polb.20925'
    wrapper.vm.$router.push(doiLink(newDOI))
    expect(wrapper.vm.doi).toBe(newDOI)

    await wrapper.vm.$nextTick()
    expect(articleMetadata.get.mock.calls.length).toBe(1)
  })
})

describe('Article.vue', () => {
  it('handles data promise rejection', async () => {
    articleMetadata.__setTestingData(false)
    articleMetadata.__setTestingRejection(true)
    wrapper = mountArticle()

    // one tick to retrieve data, one tick to update view
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.error).toBeTruthy()
    expect(wrapper.vm.loading).toBeFalsy()
    const errorTitle = wrapper.find('.article_title p')
    expect(errorTitle.exists()).toBeTruthy()
    expect(errorTitle.text()).toMatch(/Testing rejection/)
  })
})

function mountArticle (doi) {
  const wrapper = createWrapper(Article, {
    props: {},
    slots: {}
  })
  wrapper.vm.$router.push(doiLink(doi || 'fake/doi'))
  return wrapper
}

const doiLink = doi => `/explorer/article/${doi}`
