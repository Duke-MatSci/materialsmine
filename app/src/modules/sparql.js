const SPARQL_ENDPOINT = 'https://dbpedia.org/sparql'
// const SPARQL_ENDPOINT = '/sparql'

async function querySparql ( query, endpoint=SPARQL_ENDPOINT) {
    const urlEncodedQuery =`${endpoint}?query=${encodeURIComponent(query)}&output=json`
    const requestOptions = {
        method: 'POST',
        headers: { 
            'accept': 'application/sparql-results+json',
        },
    }
    return await fetch(urlEncodedQuery, requestOptions)
    .then( async res => {
        const results = await res.json()
        return results
    }).catch(err => console.log(err));
}

export { querySparql }
