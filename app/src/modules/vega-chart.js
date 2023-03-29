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

const chartType = 'http://semanticscience.org/resource/Chart'
// const lodPrefix = window.location.origin
const chartUriPrefix = 'http://nanomine.org/viz/'
const foafDepictionUri = 'http://xmlns.com/foaf/0.1/depiction'
const hasContentUri = 'http://vocab.rpi.edu/whyis/hasContent'

const chartFieldPredicates = {
  baseSpec: 'http://semanticscience.org/resource/hasValue',
  query: 'http://schema.org/query',
  title: 'http://purl.org/dc/terms/title',
  description: 'http://purl.org/dc/terms/description',
  dataset: 'http://www.w3.org/ns/prov#used'
}

const chartIdLen = 16

function generateChartId () {
  const intArr = new Uint8Array(chartIdLen / 2)
  window.crypto.getRandomValues(intArr)
  const chartId = Array.from(intArr, (dec) => ('0' + dec.toString(16)).substr(-2)).join('')

  return `${chartUriPrefix}${chartId}`
}

function buildChartLd (chart) {
  chart = Object.assign({}, chart)
  chart.baseSpec = JSON.stringify(chart.baseSpec)
  const chartLd = {
    '@id': chart.uri,
    '@type': [chartType],
    [foafDepictionUri]: {
      '@id': `${chart.uri}_depiction`,
      [hasContentUri]: chart.depiction
    }
  }
  Object.entries(chart)
    .filter(([field, value]) => chartFieldPredicates[field])
    .forEach(([field, value]) => {
      chartLd[chartFieldPredicates[field]] = [{ '@value': value }]
    })
  return chartLd
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
  // Check the chart uri before running query
  let chartUrl = chartUri
  if (chartUrl.includes('view/')) {
    // We should not get in this if logic. The issue with chart URI using a different
    // lodPrefix is now fixed (e.g. http://nanomine.org/viz/chartId instead of http://purl.org/chart/view/chartId)
    // Todo (ticket-xx): Remove this if logic if response is consistent
    chartUrl = decodeURIComponent(chartUri.split('view/')[1])
  }

  const valuesBlock = `\n  VALUES (?uri) { (<${chartUri}>) }`
  const singleChartQuery = chartQuery.replace(/(where\s*{)/i, '$1' + valuesBlock)
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

function toChartId (chartUri) {
  if (chartUri && !chartUri.startsWith(chartUriPrefix)) {
    // We should not get in this if logic. The issue with chart URI using a different
    // lodPrefix is now fixed (e.g. http://nanomine.org/viz/chartId instead of http://purl.org/chart/view/chartId)
    // Todo (ticket-xx): Remove this if logic if response is consistent
    return chartUri
  }
  if (!chartUri) return

  return chartUri.substring(chartUriPrefix.length)
}

function toChartUri (chartId) {
  if (chartId.includes('viz')) {
    return `${window.location.origin}/explorer/chart/view/${encodeURIComponent(chartId)}`
  }
  
  return chartUriPrefix + chartId
}

function shareChartUri (chartId) {
  return `${window.location.origin}/explorer/chart/view/${chartId}`
}

export { getDefaultChart, saveChart, loadChart, copyChart, buildSparqlSpec, buildCsvSpec, toChartId, toChartUri, shareChartUri, chartUriPrefix }
