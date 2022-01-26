import fetchJSON from './fetchJSON.js'

export default async function getArticleMetadata ({ doi }) {
  var semanticScholarBase = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}/`

  var articleRequest = new URL(semanticScholarBase)
  var articleFields = ['title', 'authors', 'year', 'abstract', 'citationCount', 'isOpenAccess']
  articleRequest.search = new URLSearchParams({
    fields: articleFields.join(','),
    limit: 500
  })

  var citationRequest = new URL(semanticScholarBase + 'citations')
  var citationFields = ['title', 'authors', 'year', 'paperId']
  citationRequest.search = new URLSearchParams({
    fields: citationFields.join(','),
    limit: 500
  })

  var referencesRequest = new URL(semanticScholarBase + 'references')
  var referencesFields = ['title', 'authors', 'year', 'paperId']
  referencesRequest.search = new URLSearchParams({
    fields: referencesFields.join(','),
    limit: 500
  })

  var article = await fetchJSON(articleRequest)
  var articleCitationsRaw = await fetchJSON(citationRequest)
  var articleReferencesRaw = await fetchJSON(referencesRequest)

  article.citations = cleanPapers(articleCitationsRaw, 'citingPaper')
  article.references = cleanPapers(articleReferencesRaw, 'citedPaper')
  if (article.authors) {
    article.authorNames = article.authors.map(author => author.name).join(', ')
  }

  return article
}

function cleanPapers (rawData, prop) {
  const cleanedData = rawData.data.map(paper => paper[prop]).filter(articleFilter()).sort(articleSort())
  for (const ref of cleanedData) {
    if (ref.authors) {
      ref.authorNames = ref.authors.map(author => author.name).join(', ')
    }
  }
  return cleanedData
}

function articleSort () {
  return function (a, b) {
    if (a.year < b.year) {
      return -1
    } else if (a.year > b.year) {
      return 1
    } else {
      return a.title.localeCompare(b.title)
    }
  }
}

function articleFilter () {
  return function (paper) {
    return paper.title && paper.authors && paper.year && paper.paperId
  }
}
