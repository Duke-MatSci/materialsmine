export default {
  get: async function ({ doi }) {
    const articleFields = ['title', 'authors', 'year', 'abstract', 'citationCount', 'isOpenAccess', 'venue']
    const citationFields = ['title', 'authors', 'year', 'paperId']
    const referencesFields = ['title', 'authors', 'year', 'paperId']

    const responsePromises = [
      fetchSemanticScholarResponse(doi, '', articleFields),
      fetchSemanticScholarResponse(doi, 'citations', citationFields),
      fetchSemanticScholarResponse(doi, 'references', referencesFields)
    ]
    var [
      articleResponse,
      articleCitationsResponse,
      articleReferencesResponse
    ] = (await Promise.allSettled(responsePromises)).map(value => value.value)

    if (!articleResponse || !articleResponse.ok) {
      return articleResponse
    }

    if (articleResponse.authors) {
      articleResponse.authorNames = articleResponse.authors.map(author => author.name).join(', ')
    }

    articleResponse.citations = {
      ...articleCitationsResponse,
      data: cleanPaperResponse(articleCitationsResponse, 'citingPaper')
    }
    articleResponse.references = {
      ...articleReferencesResponse,
      data: cleanPaperResponse(articleReferencesResponse, 'citedPaper')
    }

    return articleResponse
  }
}

function cleanPaperResponse (rawData, prop) {
  if (!rawData || !rawData.ok) {
    return rawData
  } else {
    const cleanedData = rawData.data.map(paper => paper[prop]).filter(articleFilter).sort(articleSort)
    for (const ref of cleanedData) {
      if (ref.authors) {
        ref.authorNames = ref.authors.map(author => author.name).join(', ')
      }
    }
    return cleanedData
  }
}

function articleSort (a, b) {
  if (a.year < b.year) {
    return -1
  } else if (a.year > b.year) {
    return 1
  } else {
    return a.title.localeCompare(b.title)
  }
}

function articleFilter (paper) {
  return paper.title && paper.authors && paper.year && paper.paperId
}

async function fetchSemanticScholarResponse (doi, path, fields) {
  const semanticScholarBase = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}/${path || ''}`
  const requestURL = new URL(semanticScholarBase)
  requestURL.search = new URLSearchParams({
    fields: fields.join(','),
    limit: 500
  })

  try {
    const rawResponse = await fetch(requestURL)
    console.log(`${rawResponse.statusText}: Retrieved ${doi} from SemanticScholar`)
    const JSONResponse = await rawResponse.json()

    return {
      ok: rawResponse.ok,
      status: rawResponse.status,
      statusText: rawResponse.statusText,
      ...JSONResponse
    }
  } catch (error) {
    if (error instanceof TypeError) {
      console.log(`Error retrieving ${doi} from SemanticScholar: ${error.message}`)

      return {
        ok: false,
        error: error.message,
        rawError: error,
        rawData: {}
      }
    } else {
      throw error
    }
  }
}
