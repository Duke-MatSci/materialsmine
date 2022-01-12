import { requestOptions } from '../queries/settings'
import { parseSPARQL } from './damien'

const parseImageData = (data) => {
  const parsedData = parseSPARQL(data)
  const images = parsedData.map(({ image }) => {
    return { src: image, alt: 'Sample image' }
  })
  return images
}

export default async function getImages (
  urlEncodedQuery,
  options = requestOptions
) {
  try {
    const res = await fetch(urlEncodedQuery, options)
    const images = await res.json().then(parseImageData)
    return images
  } catch (error) {
    console.log(error)
  }
}
