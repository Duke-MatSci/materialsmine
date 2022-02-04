import { literal, namedNode } from '@rdfjs/data-model'
import { fromRdf } from 'rdf-literal'

const defaultQuery = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?c (COUNT(?x) AS ?count)
#(MIN(?class) AS ?class) 
WHERE {
    ?x a ?c.
  #  ?c rdfs:label ?class.
}
GROUP BY ?c
ORDER BY DESC(?count)
LIMIT 4
`.trim()

const defaultSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  mark: 'bar',
  encoding: {
    x: {
      field: 'count',
      type: 'quantitative'
    },
    y: {
      field: 'c',
      type: 'ordinal'
    }
  }
}

const defaultChart = {
  uri: null,
  baseSpec: defaultSpec,
  query: defaultQuery,
  title: 'Example Bar Chart',
  description: 'An example chart that looks up the frequency for each class in the knowledge graph.',
  depiction: null
}

function getDefaultChart () {
  return Object.assign({}, defaultChart)
}

// async function loadChart(chartUri) {
//   const singleChartQuery = chartQuery + `\n  VALUES (?uri) { (<${chartUri}>) }`
//   const {results} = await querySparql(singleChartQuery)
//   const rows = results.bindings
//   if (rows.length < 1) {
//     throw `No chart found for uri: ${chartUri}`
//   }
//   return await readChartSparqlRow(rows[0])
// }

// async function readChartSparqlRow(chartResult) {
//   const chart = {}
//   Object.entries(chartResult)
//     .forEach(([field, value]) => chart[field] = value.value)
//   if (chart.baseSpec) {
//     chart.baseSpec = JSON.parse(chart.baseSpec)
//   } else if (chart.downloadUrl) {
//     const {data} = await axios.get(`/about?uri=${chart.uri}`)
//     chart.baseSpec = data
//   }
//   return chart
// }

function transformSparqlData (sparqlResults) {
  const data = []
  if (sparqlResults) {
    for (const row of sparqlResults.results.bindings) {
      const resultData = {}
      data.push(resultData)
      Object.entries(row).forEach(([field, result, t]) => {
        let value = result.value
        if (result.type === 'literal' && result.datatype) {
          value = fromRdf(literal(value, namedNode(result.datatype)))
        }
        resultData[field] = value
      })
    }
  }
  return data
}

function buildSparqlSpec (baseSpec, sparqlResults) {
  if (!baseSpec) {
    return null
  }
  const spec = Object.assign({}, baseSpec)
  spec.data = { values: transformSparqlData(sparqlResults) }
  return spec
}

export { getDefaultChart, buildSparqlSpec }
