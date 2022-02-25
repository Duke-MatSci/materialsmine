const SPARQL_ENDPOINT = 'https://materialsmine.org/wi/sparql'

async function querySparql (query, endpoint = SPARQL_ENDPOINT) {
  const urlEncodedQuery = `${endpoint}?query=${encodeURIComponent(
    query
  )}&output=json`
  const requestOptions = {
    headers: {
      accept: 'application/sparql-results+json'
    }
  }
  return await fetch(urlEncodedQuery, requestOptions)
    .then(async (res) => {
      const results = await res.json()
      return results
    })
    .catch((err) => console.log(err))
}

function parseSparql (response) {
  const queryResults = []
  for (let i = 0; i < response.results.bindings.length; i++) {
    const newObject = {}
    const row = response.results.bindings[i]
    for (const variable of response.head.vars) {
      if (row !== undefined && row[variable] !== undefined && row[variable]) {
        if (!isNaN(row[variable].value)) {
          newObject[variable] = +row[variable].value
        } else {
          newObject[variable] = row[variable].value
        }
        queryResults[i] = newObject
      }
    }
  }

  return queryResults
}

export { querySparql, parseSparql }
