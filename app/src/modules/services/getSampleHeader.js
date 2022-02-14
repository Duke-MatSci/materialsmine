import { requestOptions, querySparqlEndpoint } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  if (!parsedData.length) return null
  const [sampleData] = parsedData
  return sampleData
}

export default async function getSampleHeader ({
  query,
  route,
  options = requestOptions
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route })
  const res = await fetch(urlEncodedQuery, options)
  const title = await res.json().then(parseTitleData)
  return title
}
