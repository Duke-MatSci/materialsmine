import articleMetadata from '@/modules/explorer/article/services/articleMetadata'
import { rawResponse, cleanResponse } from '@/modules/explorer/article/services/__mocks__/articleMetadata'

global.fetch = jest.fn()

global.console = {
  log: jest.fn(), // console.log are ignored in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

describe('articleMetadata.js', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('translates Semantic Scholar data correctly', async () => {
    global.fetch = response('good', 'all')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.title).toBe(cleanResponse.title)
    expect(article.references.data[0].paperId).toBe(cleanResponse.references[0].paperId)
  })

  it('handles a bad fetch response to the article request', async () => {
    global.fetch = response('bad', 'article')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.error).toMatch(/Testing bad response/)
  })

  it('handles a bad fetch response to the references request', async () => {
    global.fetch = response('bad', 'references')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.references.error).toMatch(/Testing bad response/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a bad fetch response to the citations request', async () => {
    global.fetch = response('bad', 'citations')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.citations.error).toMatch(/Testing bad response/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a rejected fetch response to the article request', async () => {
    global.fetch = response('reject', 'article')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.error).toMatch(/Testing rejection/)
  })

  it('handles a rejected fetch response to the references request', async () => {
    global.fetch = response('reject', 'references')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.references.error).toMatch(/Testing rejection/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a rejected fetch response to the citations request', async () => {
    global.fetch = response('reject', 'citations')
    const article = await articleMetadata.get({ doi: '10.1063/1.5046839' })
    expect(article.citations.error).toMatch(/Testing rejection/)
    expect(article.title).toBe(cleanResponse.title)
  })
})

function response (responseType, testingSection) {
  return jest.fn((requestURL) => {
    // check which section is being requested, compare to testingSection
    const URLString = requestURL.toString()
    let requestedSection
    if (URLString.match(/citations/)) {
      requestedSection = 'citations'
    } else if (URLString.match(/references/)) {
      requestedSection = 'references'
    } else {
      requestedSection = 'article'
    }

    // only return non-good response if testingSection, requested section match
    if (responseType !== 'good' && testingSection === requestedSection) {
      if (responseType === 'bad') {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Testing Not Found',
          json: () => Promise.resolve({ error: 'Testing bad response' }),
        })
      } else if (responseType === 'reject') {
        return Promise.reject(new TypeError('Testing rejection of fetch(article) Promise'))
      }
    } else {
      // responseType is good, or we aren't testing this section
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(rawResponse[requestedSection])
      })
    }
  })
}
