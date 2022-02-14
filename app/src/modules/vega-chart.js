import { literal, namedNode } from '@rdfjs/data-model'
import { fromRdf } from 'rdf-literal'
import { querySparql } from '@/modules/sparql'

const defaultQuery = `
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?c (COUNT(?x) AS ?count) (MIN(?class) AS ?class) 
WHERE {
    ?x a ?c.
    ?c rdfs:label ?class.
}
GROUP BY ?c
ORDER BY DESC(?count)
LIMIT 10
`.trim()

const defaultSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  mark: 'bar',
  encoding: {
    x: {
      field: 'count',
      type: 'quantitative'
    },
    y: {
      field: 'class',
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

const chartQuery = `
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX schema: <http://schema.org/>
  PREFIX sio: <http://semanticscience.org/resource/>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX prov: <http://www.w3.org/ns/prov#>
  PREFIX dcat: <http://www.w3.org/ns/dcat#>
  SELECT DISTINCT ?uri ?downloadUrl ?title ?description ?query ?dataset ?baseSpec ?depiction
  WHERE {
    ?uri a sio:Chart .
    OPTIONAL { ?uri dcterms:title ?title } .
    OPTIONAL { ?uri dcterms:description ?description } .
    OPTIONAL { ?uri schema:query ?query } .
    OPTIONAL { ?uri prov:used ?dataset}
    OPTIONAL { ?uri sio:hasValue ?baseSpec } .
    OPTIONAL { ?uri foaf:depiction ?depiction } .
    OPTIONAL { ?uri dcat:downloadURL ?downloadUrl } .
  }
  `

async function loadChart (chartUri) {
  const singleChartQuery = chartQuery + `\n  VALUES (?uri) { (<${chartUri}>) }`
  const { results } = await querySparql(singleChartQuery)
  const rows = results.bindings
  if (rows.length < 1) {
    console.error(`No chart found for uri: ${chartUri}`)
  }
  return await readChartSparqlRow(rows[0])
}

async function readChartSparqlRow (chartResult) {
  const chart = {}
  Object.entries(chartResult)
    .forEach(([field, value]) => { chart[field] = value.value })
  if (chart.baseSpec) {
    chart.baseSpec = JSON.parse(chart.baseSpec)
  // } else if (chart.downloadUrl) {
  //   const { data } = await axios.get(`/about?uri=${chart.uri}`)
  //   chart.baseSpec = data
  }
  return chart
}

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

export { getDefaultChart, loadChart, buildSparqlSpec }
