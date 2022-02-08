import createWrapper from '../../../jest/script/wrapper'
import News from '@/pages/nanomine/researchnews/News.vue'

var wrapper = null

describe('News.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(News, { props: {}, slots: {} })
  })
  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('loads research', () => {
    const research = wrapper.findAll('.research')
    expect(research.length).toBeGreaterThanOrEqual(1)
  })

  it('loads news', () => {
    const news = wrapper.findAll('.news-container')
    expect(news.length).toBeGreaterThanOrEqual(1)
  })
})
