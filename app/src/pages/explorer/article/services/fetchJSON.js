export default async function fetchJSON(requestURL){
  return fetch(requestURL).then(response => {
    if (!response.ok) {
      response.text().then(data => {
        throw new Error(`${response.status} ${JSON.parse(data).error}`)
      })
    }
    else {
      return response.json()
    }
  }).then(data => {
    return data
  }).catch(error => {
    console.error(`Error while fetching ${requestURL}:`, error)
  })
}