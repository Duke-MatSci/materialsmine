import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'
const parseTitleData = (data) => {
  const parsedData = parseSPARQL(data)
  const [sampleData] = parsedData
  // const SampleData = parsedData.map(item => {
  //   const { DOI, process_label: processLabel, sample_label: sampleLabel }  = item
  //   return {DOI, processLabel, sampleLabel}
    
  // })
  // console.log(sampleData)
  // const { DOI, sample_label: sampleLabel } = data.results.bindings[0]
  // const { value: DOIroute } = DOI
  // const { value: label } = sampleLabel
  return sampleData
}

export default async function getTitle (
  urlEncodedQuery,
  options = requestOptions
) {
  try {
    const res = await fetch(urlEncodedQuery, options)
    const title = await res.json().then(parseTitleData)
    return title
  } catch (error) {
    console.log(error)
  }
}
