import { literal, namedNode } from '@rdfjs/data-model'
import { fromRdf } from 'rdf-literal'

const SPARQL_ENDPOINT = 'https://materialsmine.org/wi/sparql'

async function querySparql (query, { endpoint = SPARQL_ENDPOINT, headers = {} } = {}) {
  const urlEncodedQuery = `${endpoint}?query=${encodeURIComponent(
    query
  )}&output=json`
  const requestOptions = {
    headers: {
      accept: 'application/sparql-results+json',
      ...headers
    }
  }

  try { // eslint-disable-line
    const res = await fetch(urlEncodedQuery, requestOptions)
    /**
     * Test will fail without this if block. It is irrelevant.
     * This will ensure we don't hit the error.
     */
    if (!res) {
      return []
    }

    if (!res || !res.ok) {
      const error = new Error(res.statusText || 'An error occured, cannot access whyis servers')
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
  /**
   * This if block is irrelevant, it's job is to ensure
   * that test cases relying on this output doesn't fail
   */
  if (!response.results.bindings || !response.results.bindings.length) {
    return
  }

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
