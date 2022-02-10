export default {
  /**
   * Retrieves article metadata for the given DOI, including:
   * title, authors, publication year, publication venue, Open Access status,
   * abstract, citation count;
   * as well as the following for each citing paper and referenced paper:
   * title, authors, publication year
   * @param {string} doi DOI to request metadata for
   * @returns article metadata, or error response if API call fails
   */
  get: async function ({ doi }) {
    // SemanticScholar API fields
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

    // if article metadata is missing or errored, there is nothing else to return
    if (!articleResponse || !articleResponse.ok) {
      return articleResponse
    }

    // clean up author names into easily displayed string
    if (articleResponse.authors) {
      articleResponse.authorNames = articleResponse.authors.map(author => author.name).join(', ')
    }

    // for citations, references, pass original response with cleaned data, in case of errors
    // bundle into article response for easy return
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

/**
 * Sorts and cleans the raw array of citation/reference responses from SemanticScholar
 * @param {*} rawData raw SemanticScholar API response
 * @param {*} prop 'citingPaper' if cleaning citations, 'citedPaper' if cleaning references
 * @returns A sorted, filtered, and cleaned array of citations or references
 */
function cleanPaperResponse (rawData, prop) {
  if (!rawData || !rawData.ok) { // if data was not returned or had an error, skip cleaning
    return rawData
  } else {
    // filter response items that are missing data, sort by year and title
    const cleanedData = rawData.data.map(paper => paper[prop]).filter(articleFilter).sort(articleSort)

    // clean up author names into easily displayed string
    for (const ref of cleanedData) {
      if (ref.authors) {
        ref.authorNames = ref.authors.map(author => author.name).join(', ')
      }
    }
    return cleanedData
  }
}

/** Sort function for citations, references */
function articleSort (a, b) {
  if (a.year < b.year) {
    return -1
  } else if (a.year > b.year) {
    return 1
  } else {
    return a.title.localeCompare(b.title)
  }
}

/** Filter function for citations, references */
function articleFilter (paper) {
  return paper.title && paper.authors && paper.year && paper.paperId
}

/**
 * Gets SemanticScholar API response for a given DOI, path, and set of query fields.
 * @param {string} doi DOI string to query for
 * @param {string} path 'citations' for querying citations, 'references' for querying references, or blank for articles
 * @param {Array.<string>} fields query fields to request from SemanticScholar
 * @returns article response with JSON representation parsed, or error information
 */
async function fetchSemanticScholarResponse (doi, path, fields) {
  const semanticScholarQueryBase = `${doi}/${path || ''}`
  const requestURL = new URL(`https://api.semanticscholar.org/graph/v1/paper/DOI:${semanticScholarQueryBase}`)
  requestURL.search = new URLSearchParams({
    fields: fields.join(','),
    limit: 500
  })

  try {
    const rawResponse = await fetch(requestURL)
    console.log(`${rawResponse.statusText}: Retrieved ${semanticScholarQueryBase} from SemanticScholar`)
    const JSONResponse = await rawResponse.json()

    // pass along important Response properties returned by fetch() too, it
    // contains server response codes including errors
    return {
      ok: rawResponse.ok,
      status: rawResponse.status,
      statusText: rawResponse.statusText,
      ...JSONResponse
    }
  } catch (error) {
    if (error instanceof TypeError) { // fetch throws TypeErrors for network issues
      console.log(`Error retrieving ${semanticScholarQueryBase} from SemanticScholar: ${error.message}`)
      // mock the important Response properties for ease of use
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
