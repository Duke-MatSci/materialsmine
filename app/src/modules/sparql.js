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

  try { // eslint-disable-line
    const res = await fetch(urlEncodedQuery, requestOptions)
    if (!res || !res.ok) {
      const error = new Error(`An error occured - ${res?.statusText}`)
      throw (error)
    }
    const results = await res.json()
    return results
  } catch (err) {
    throw (err)
  }
}

function parseSparql (response) {
  const queryResults = []
  try { // eslint-disable-line
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
  } catch (err) {
    throw new Error(err)
  }
  return queryResults
}

async function queryAndParseSparql (query, endpoint = SPARQL_ENDPOINT) {
  return parseSparql(await querySparql(query, endpoint))
}

export { querySparql, parseSparql, queryAndParseSparql } // queryAndParseSparql as default ?
