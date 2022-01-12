import { requestOptions } from '../queries/settings'

const parseCardsData = data => {
  const extractAllClasses = data.results.bindings.map(classType => {
    const { value } = classType.std_name
    return value
  })

  const classes = [...new Set(extractAllClasses)]
  const cardsData = classes.map(className => {
    return { name: className }
  })

  cardsData.forEach(uniqueClass => {
    const classData = data.results.bindings
      .filter(item => item.std_name.value === uniqueClass.name)
      .map(item => {
        const { value: url } = item.attrType
        const slug = url
          .split('/')
          .pop()
          .match(/[A-Z][a-z]+|[0-9]+/g)
          .join(' ')
        const { value: unit } = item.attrUnits
        const { value } = item.attrValue
        const { value: label } = item.fullLabel
        return {
          url,
          slug,
          value,
          unit,
          label
        }
      })
    uniqueClass.properties = [...classData]
  })
  return cardsData
}

export default async function getCardsData (
  urlEncodedQuery,
  options = requestOptions
) {
  try {
    const res = await fetch(urlEncodedQuery, options)
    const cardsData = await res.json().then(parseCardsData)
    return cardsData
  } catch (error) {
    console.log(error)
  }
}
