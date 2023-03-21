import { querySparql, parseSparql } from '@/modules/sparql'
import { deleteNanopub, listNanopubs, postNewNanopub } from './whyis-utils'

const defaultQuery = `
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX nm: <http://materialsmine.org/ns/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT * WHERE {
    ?sample a nm:PolymerNanocomposite ;
            sio:hasAttribute [ a nm:TensileModulus ;
                               sio:hasValue ?YoungsModGPa ;
                               sio:hasUnit ?YoungsModUnit ] ,
                             [ a nm:ElongationAtYield ;
                               sio:hasValue ?YieldStrainPercent ;
                               sio:hasUnit ?ElongBreakUnit ] .
   ?YoungsModUnit rdfs:label "Gigapascal" .
   ?ElongBreakUnit rdfs:label "Percent" .
}
`.trim()

const defaultSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  mark: 'point',
  encoding: {
    x: {
      field: 'YieldStrainPercent',
      type: 'quantitative'
    },
    y: {
      field: 'YoungsModGPa',
      type: 'quantitative'
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
const lodPrefix = 'http://purl.org/whyis/local'
const foafDepictionUri = 'http://xmlns.com/foaf/0.1/depiction'
const hasContentUri = 'http://vocab.rpi.edu/whyis/hasContent'

const chartFieldPredicates = {
  baseSpec: 'http://semanticscience.org/resource/hasValue',
  query: 'http://schema.org/query',
  title: 'http://purl.org/dc/terms/title',
  description: 'http://purl.org/dc/terms/description',
  dataset: 'http://www.w3.org/ns/prov#used'
}

// Todo (ticket xx): Do we need this?
const chartPrefix = 'viz'
const chartIdLen = 16

function generateChartId () {
  const intArr = new Uint8Array(chartIdLen / 2)
  window.crypto.getRandomValues(intArr)
  const chartId = Array.from(intArr, (dec) => ('0' + dec.toString(16)).substr(-2)).join('')

  return `${lodPrefix}/${chartPrefix}/${chartId}`
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
  console.log('visualization starts')
  return Object.assign({}, defaultChart)
}

/**
 * Copies the given chart except for the id field, which is generated from scratch
 * also the depiction is removed
 */
function copyChart (sourceChart) {
  // Shallow copy is OK for the current chart structure
  const newChart = Object.assign({}, sourceChart)
  newChart.uri = generateChartId()
  delete newChart.depiction
  return newChart
}

async function deleteChart (chartUri) {
  return listNanopubs(chartUri)
    .then(nanopubs => {
      if (!nanopubs || !nanopubs.length) return
      return Promise.all(nanopubs.map(nanopub => deleteNanopub(nanopub.np)))
    })
}

async function saveChart (chart) {
  let deletePromise = Promise.resolve()
  if (chart.uri) {
    deletePromise = deleteChart(chart.uri)
  } else {
    chart.uri = generateChartId()
  }
  const chartLd = buildChartLd(chart)
  return deletePromise
    .then(() => postNewNanopub(chartLd))
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
// Todo (ticket xx): Are we still using this @Anya?
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

export { getDefaultChart, saveChart, loadChart, copyChart, buildSparqlSpec, buildCsvSpec, toChartId, toChartUri, chartUriPrefix }
