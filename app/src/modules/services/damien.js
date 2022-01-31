export function parseSPARQL (response) {
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
