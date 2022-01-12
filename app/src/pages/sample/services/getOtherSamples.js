import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseOtherSamples = (data) => {
  const parsedData = parseSPARQL(data)
  const links = parsedData.map(({ sample }) => sample.split('/').pop())
  return links
}

export default async function getOtherSamples (
  urlEncodedQuery,
  options = requestOptions
) {
  try {
    const res = await fetch(urlEncodedQuery, options)
    const samples = await res.json().then(parseOtherSamples)
    return samples
  } catch (error) {
    console.log(error)
  }
}
