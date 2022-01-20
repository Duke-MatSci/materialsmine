import { requestOptions, querySparqlEndpoint } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  if (!parsedData.length) return null
  const [processLabelObject] = parsedData
  const { process_label: processLabel } = processLabelObject
  return processLabel
}

export default async function getClass ({
  query,
  route,
  options = requestOptions
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route })
  const res = await fetch(urlEncodedQuery, options)
  const classes = await res.json().then(parseTitleData)
  return classes
}
