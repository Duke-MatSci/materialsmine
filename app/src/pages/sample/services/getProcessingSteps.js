import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'
import { querySparqlEndpoint } from "../queries/settings";

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  const steps = parsedData.map(
    ({ param_label: parameterLabel, Descr: description }) => {
      return { parameterLabel, description }
    }
  )
  return steps
}

export default async function getProcessingSteps ({
  query,
  route,
  options = requestOptions,
}) {
  const urlEncodedQuery = querySparqlEndpoint({ query, route });
  const res = await fetch(urlEncodedQuery, options)
  const classes = await res.json().then(parseTitleData)
  return classes
}
