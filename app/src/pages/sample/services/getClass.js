import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  const [processLabelObject] = parsedData
  const { process_label: processLabel } = processLabelObject
  return processLabel
}

export default async function getClass (
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
