import { literal, namedNode } from '@rdfjs/data-model'
import { fromRdf } from 'rdf-literal'

const SPARQL_ENDPOINT = 'https://materialsmine.org/wi/sparql'

async function querySparql (query, endpoint = SPARQL_ENDPOINT) {
  const urlEncodedQuery = `${endpoint}?query=${encodeURIComponent(
    query
  )}&output=json`
  const requestOptions = {
    headers: {
      accept: 'application/sparql-results+json'
    }
  }
  return await fetch(urlEncodedQuery, requestOptions)
    .then(async (res) => {
      const results = await res.json()
      return results
    })
    .catch((err) => console.log(err))
}

function parseSparql (response) {
  const queryResults = []
  if (response) {
    for (const row of response.results.bindings) {
      const rowData = {}
      queryResults.push(rowData)
      Object.entries(row).forEach(([field, result, t]) => {
        let value = result.value
        if (result.type === 'literal' && result.datatype) {
          value = fromRdf(literal(value, namedNode(result.datatype)))
        }
        rowData[field] = value
      })
    }
  }
  return queryResults
}

export { querySparql, parseSparql }
