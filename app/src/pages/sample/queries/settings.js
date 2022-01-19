const urlEndpoint = 'https://materialsmine.org/wi/sparql'

export const commonPrefixes = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX mm: <http://materialsmine.org/ns/>
PREFIX prov: <http://www.w3.org/ns/prov#>`

export const requestOptions = {
  headers: { accept: 'application/sparql-results+json' }
}
export const encodeQuery = (query) =>
  `${urlEndpoint}?query=${encodeURIComponent(query)}&output=json`

export const querySparqlEndpoint = ({ query, route }) => {
  const sparqlQuery = query(route)
  return encodeQuery(sparqlQuery)
}
