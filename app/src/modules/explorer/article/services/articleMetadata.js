export default {
  get: async function ({ doi }) {
    const semanticScholarBase = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}/`

    const articleRequest = new URL(semanticScholarBase)
    const articleFields = ['title', 'authors', 'year', 'abstract', 'citationCount', 'isOpenAccess', 'venue']
    articleRequest.search = new URLSearchParams({
      fields: articleFields.join(','),
      limit: 500
    })

    const citationRequest = new URL(semanticScholarBase + 'citations')
    const citationFields = ['title', 'authors', 'year', 'paperId']
    citationRequest.search = new URLSearchParams({
      fields: citationFields.join(','),
      limit: 500
    })

    const referencesRequest = new URL(semanticScholarBase + 'references')
    const referencesFields = ['title', 'authors', 'year', 'paperId']
    referencesRequest.search = new URLSearchParams({
      fields: referencesFields.join(','),
      limit: 500
    })

    const article = await fetchJSON(articleRequest)
    const articleCitationsRaw = await fetchJSON(citationRequest)
    const articleReferencesRaw = await fetchJSON(referencesRequest)

    article.citations = cleanPapers(articleCitationsRaw, 'citingPaper')
    article.references = cleanPapers(articleReferencesRaw, 'citedPaper')
    if (article.authors) {
      article.authorNames = article.authors.map(author => author.name).join(', ')
    }

    return article
  }
}

function cleanPapers (rawData, prop) {
  const cleanedData = rawData.data.map(paper => paper[prop]).filter(articleFilter).sort(articleSort)
  for (const ref of cleanedData) {
    if (ref.authors) {
      ref.authorNames = ref.authors.map(author => author.name).join(', ')
    }
  }
  return cleanedData
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

async function fetchJSON (requestURL) {
  return fetch(requestURL).then(response => {
    if (!response.ok) {
      response.text().then(data => {
        throw new Error(`${response.status} ${JSON.parse(data).error}`)
      })
    } else {
      return response.json()
    }
  }).then(data => {
    return data
  }).catch(error => {
    console.error(`Error while fetching ${requestURL}:`, error)
  })
}
