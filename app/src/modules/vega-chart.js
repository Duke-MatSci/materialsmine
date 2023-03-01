import { querySparql, parseSparql } from '@/modules/sparql'

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
    throw new Error(`No chart found for uri: ${chartUri}`)
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

function buildSparqlSpec (baseSpec, sparqlResults) {
  if (!baseSpec) {
    return null
  }
  const spec = Object.assign({}, baseSpec)
  spec.data = { values: parseSparql(sparqlResults) }
  return spec
}

function buildCsvSpec (baseSpec, csvResults) {
  if (!baseSpec) {
    return null
  }
  const spec = Object.assign({}, baseSpec)
  spec.data = { values: csvResults }
  return spec
}

const chartUriPrefix = 'http://nanomine.org/viz/'

function toChartId (chartUri) {
  if (!chartUri.startsWith(chartUriPrefix)) {
    throw new Error(`Unexpected chart uri "${chartUri}". Was expecting prefix "${chartUriPrefix}"`)
  }
  return chartUri.substring(chartUriPrefix.length)
}

function toChartUri (chartId) {
  return chartUriPrefix + chartId
}

export { getDefaultChart, loadChart, buildSparqlSpec, buildCsvSpec, toChartId, toChartUri, chartUriPrefix }
