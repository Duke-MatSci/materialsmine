import articleMetadata from '@/modules/explorer/article/services/articleMetadata'
import { rawResponse, cleanResponse } from '@/modules/explorer/article/services/__mocks__/articleMetadata'

const doi = { doi: '10.1063/1.5046839' }

describe('articleMetadata.js', () => {
  beforeEach(async () => {
    fetch.mockClear()
  })

  it('translates Semantic Scholar data correctly', async () => {
    global.fetch = await response('good', 'all')
    const article = await articleMetadata.get(doi)
    expect(article.title).toBe(cleanResponse.title)
    expect(article.references.data[0].paperId).toBe(cleanResponse.references[0].paperId)
  })

  it('handles a bad fetch response to the article request', async () => {
    global.fetch = await response('bad', 'article')
    const article = await articleMetadata.get(doi)
    expect(article.error).toMatch(/Testing bad response/)
  })

  it('handles a bad fetch response to the references request', async () => {
    global.fetch = await response('bad', 'references')
    const article = await articleMetadata.get(doi)
    expect(article.references.error).toMatch(/Testing bad response/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a bad fetch response to the citations request', async () => {
    global.fetch = await response('bad', 'citations')
    const article = await articleMetadata.get(doi)
    expect(article.citations.error).toMatch(/Testing bad response/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a rejected fetch response to the article request', async () => {
    global.fetch = await response('reject', 'article')
    const article = await articleMetadata.get(doi)
    expect(article.error).toMatch(/Testing rejection/)
  })

  it('handles a rejected fetch response to the references request', async () => {
    global.fetch = await response('reject', 'references')
    const article = await articleMetadata.get(doi)
    expect(article.references.error).toMatch(/Testing rejection/)
    expect(article.title).toBe(cleanResponse.title)
  })

  it('handles a rejected fetch response to the citations request', async () => {
    global.fetch = await response('reject', 'citations')
    const article = await articleMetadata.get(doi)
    expect(article.citations.error).toMatch(/Testing rejection/)
    expect(article.title).toBe(cleanResponse.title)
  })
})

/**
 * Returns a jest mock function with the proper functionality for the test,
 * either returning complete data, a mocked 404 response, or a rejected
 * promise.
 *
 * responseType determines whether the return value of the mock is a 200
 * response with data, a 404 response without, or a rejected Promise.
 * testingSection determines the section that receives the 404 or rejected
 * Promise, for isolated testing. Has no effect if responseType is 'good'.
 * @param {string} responseType either 'good', 'bad', or 'reject
 * @param {*} testingSection either 'article', 'citations', or 'references'
 * @returns a jest mock with the requested return functionality
 */
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
          json: () => Promise.resolve({ error: 'Testing bad response' })
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
