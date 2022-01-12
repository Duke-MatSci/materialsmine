import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  const steps = parsedData.map(
    ({ param_label: parameterLabel, Descr: description }) => {
      return { parameterLabel, description }
    }
  )
  return steps
}

export default async function getProcessingSteps (
  urlEncodedQuery,
  options = requestOptions
) {
  try {
    const res = await fetch(urlEncodedQuery, options)
    const classes = await res.json().then(parseTitleData)
    return classes
  } catch (error) {
    console.log(error)
  }
}
