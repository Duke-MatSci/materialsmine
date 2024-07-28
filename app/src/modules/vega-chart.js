import { querySparql, parseSparql } from '@/modules/sparql'
import { deleteNanopub, listNanopubs, postNewNanopub } from './whyis-utils'
import { deleteResources } from './whyis-dataset'

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
  description:
    'An example chart that looks up the frequency for each class in the knowledge graph.',
  depiction: null
}

const chartType = 'http://semanticscience.org/resource/Chart'
// const lodPrefix = window.location.origin
const chartUriPrefix = 'http://nanomine.org/explorer/chart/view/'
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

function generateChartId (isXml) {
  const intArr = new Uint8Array(chartIdLen / 2)
  window.crypto.getRandomValues(intArr)
  const chartId = Array.from(intArr, (dec) =>
    ('0' + dec.toString(16)).substr(-2)
  ).join('')

  return isXml ? chartId : `${chartUriPrefix}${chartId}`
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
function matchValidXmlTitle (title) {
  const rv = title.match(
    /^[A-Z]([0-9]+)[_][S]([0-9]+)[_]([\S]+)[_](\d{4})([.][Xx][Mm][Ll])?$/
  ) // e.g. L183_S12_Poetschke_2003.xml
  return rv
}

function buildXmlLd (xmlData, xmlId) {
  const nmRdfLodPrefix = `${new URL(window.location)?.host}`
  const xmlTitle = xmlData.title
  const b64XmlData = str2b64(xmlData.xmlString)
  const whyisId = xmlId
  const tileArray = matchValidXmlTitle(xmlTitle)
  const dataset = tileArray[1]
  const dsSeq = tileArray[2]

  return {
    '@context': {
      '@base': `${nmRdfLodPrefix}`,
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      whyis: 'http://vocab.rpi.edu/whyis/',
      np: 'http://www.nanopub.org/nschema#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      sio: 'http://semanticscience.org/resource/',
      dc: 'http://purl.org/dc/terms/',
      prov: 'http://www.w3.org/ns/prov#',
      mt: 'https://www.iana.org/assignments/media-types/'
    },
    '@id': `urn:${whyisId}`,
    '@graph': {
      '@id': `urn:${whyisId}`,
      '@type': 'np:Nanopublication',
      'np:hasAssertion': {
        '@id': `urn:${whyisId}_assertion`,
        '@type': 'np:Assertion',
        '@graph': [
          {
            '@id': `${nmRdfLodPrefix}/explorer/xml/visualizer/${xmlData.id}?isNewCuration=${xmlData.isNewCuration}`,
            '@type': [
              'schema:DataDownload',
              'mt:text/xml',
              'http://nanomine.org/ns/NanomineXMLFile'
            ],
            'whyis:hasContent': `data:text/xml;charset=UTF-8;base64,${b64XmlData}`,
            'dc:conformsTo': {
              '@id': `${nmRdfLodPrefix}/api/curate/schema?getXSD=true`
            }
          },
          {
            '@id': `${nmRdfLodPrefix}/api/curate/${dataset}/${dsSeq}`,
            '@type': 'schema:Dataset',
            'schema:distribution': [
              {
                '@id': `${nmRdfLodPrefix}/explorer/xml/visualizer/${xmlData.id}?isNewCuration=${xmlData.isNewCuration}`
              }
            ]
          }
        ]
      }
    }
  }
}

function buildXsdLd (xsdData, xsdId, schemaName) {
  const nmRdfLodPrefix = `${new URL(window.location)?.host}`
  const schemaText = xsdData.replace(/[\n]/g, '')
  const b64SchemaData = str2b64(schemaText)
  return {
    '@context': {
      '@base': `${nmRdfLodPrefix}`,
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      whyis: 'http://vocab.rpi.edu/whyis/',
      np: 'http://www.nanopub.org/nschema#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      sio: 'http://semanticscience.org/resource/',
      dc: 'http://purl.org/dc/terms/',
      prov: 'http://www.w3.org/ns/prov#',
      mt: 'https://www.iana.org/assignments/media-types/'
    },
    '@id': `urn:${xsdId}`,
    '@graph': {
      '@id': `urn:${xsdId}`,
      '@type': 'np:Nanopublication',
      'np:hasAssertion': {
        '@id': `urn:${xsdId}_assertion`,
        '@type': 'np:Assertion',
        '@graph': [
          {
            '@id': `${nmRdfLodPrefix}/nmr/schema/${schemaName}`,
            '@type': ['mt:text/xml', 'http://www.w3.org/2001/XMLSchema'],
            'whyis:hasContent': `data:text/xml;charset=UTF-8;base64,${b64SchemaData}`
          }
        ]
      }
    }
  }
}

function getDefaultChart () {
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
  return listNanopubs(chartUri).then((nanopubs) => {
    if (!nanopubs || !nanopubs.length) return
    return Promise.all(
      nanopubs.map(async (nanopub) => await deleteNanopub(nanopub.np))
    )
  })
}

async function saveChart (chart) {
  if (chart.uri) {
    await deleteChart(chart.uri)
  } else {
    chart.uri = generateChartId()
  }

  const chartLd = buildChartLd(chart)
  return await postNewNanopub(chartLd)
}

async function saveXml (xml, token) {
  let xmlId
  try {
    const changeLogResponse = await fetch(
      `/api/curate/changelogs/${xml.id}?published=true`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    if (changeLogResponse.ok) {
      const latestPublishedXml = await changeLogResponse.json()
      const latestPublishedXmlUri = latestPublishedXml?.change?.[0]
      if (latestPublishedXmlUri) {
        await deleteResources(latestPublishedXmlUri)
        xmlId = latestPublishedXmlUri
      } else {
        xmlId = generateChartId(true)
      }
    } else {
      throw new Error(
        `Failed to get latest published xml: ${changeLogResponse.statusText}`
      )
    }
    const xmlLd = buildXmlLd(xml, xmlId)
    const nanopub = await postNewNanopub(xmlLd, true)

    if (nanopub) {
      const approvalPromise = fetch('/api/curate/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ curationId: xml.id, isNew: xml.isNewCuration })
      })

      const changeLogPromise = fetch(`/api/curate/changelogs/${xml.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceId: xml.id,
          change: [xmlId],
          published: true
        })
      })

      const [approvalResponse, changeLogResponse] = await Promise.all([
        approvalPromise,
        changeLogPromise
      ])

      // TODO: What happens if one fail & one passes?
      if (!approvalResponse.ok) {
        throw new Error(
          `Failed to approve a curation: ${approvalResponse.statusText}`
        )
      }
      if (!changeLogResponse.ok) {
        throw new Error(
          `Failed to post change log: ${changeLogResponse.statusText}`
        )
      }
    }

    return { whyisId: xmlId, controlID: xml.title, status: 'ok' }
  } catch (error) {
    throw new Error(`Error in saveXml: ${error.message}`)
  }
}

async function publishXSD (xsd, token) {
  const xsdId = generateChartId(true)
  const schemaName = `Schema_${xsdId}_${new Date()
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    .replace(/\//g, '')}`

  const xsdLd = buildXsdLd(xsd, xsdId, schemaName)
  const nanopub = await postNewNanopub(xsdLd, true)

  if (nanopub) {
    const publishResponse = await fetch('/api/curate/changelogs/schema_id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        resourceId: 'schema_id',
        change: [xsdId],
        published: true
      })
    })

    if (!publishResponse.ok) {
      throw new Error(
        `Failed to publish schema: ${publishResponse.statusText}`
      )
    }
  }
  return nanopub
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
  } else if (!chartUri.startsWith('http')) {
    // This is currently needed for editing since gallery only passes ID and not the full uri
    chartUrl = `${chartUriPrefix}${chartUri}`
  }

  const valuesBlock = `\n  VALUES (?uri) { (<${chartUrl}>) }`
  const singleChartQuery = chartQuery.replace(
    /(where\s*{)/i,
    '$1' + valuesBlock
  )
  const { results } = await querySparql(singleChartQuery)
  const rows = results.bindings

  if (rows.length < 1) {
    throw new Error(`No data found for the specified chart URI: ${chartUrl}`)
  }

  return await readChartSparqlRow(rows[0])
}

async function readChartSparqlRow (chartResult) {
  const chart = {}
  Object.entries(chartResult).forEach(([field, value]) => {
    chart[field] = value.value
  })
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
    return `${window.location.origin}/explorer/chart/view/${encodeURIComponent(
      chartId
    )}`
  }

  return chartUriPrefix + chartId
}

function shareableChartUri (chartId) {
  return `${window.location.origin}/explorer/chart/view/${chartId}`
}

const str2b64 = (str) => Buffer.from(str).toString('base64')

export {
  getDefaultChart,
  saveChart,
  saveXml,
  publishXSD,
  deleteChart,
  loadChart,
  copyChart,
  buildSparqlSpec,
  buildCsvSpec,
  toChartId,
  toChartUri,
  shareableChartUri,
  chartUriPrefix
}
