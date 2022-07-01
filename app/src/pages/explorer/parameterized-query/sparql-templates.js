
import { literal, namedNode } from '@rdfjs/data-model'
import { fromRdf } from 'rdf-literal'
// import { querySparql } from '@/modules/sparql'
import { RDF, RDFS, SCHEMA } from '@/modules/common-namespaces'
import templateRdfStrs from './templates'
// import loadSparqlTemplatesQuery from './load-sparql-templates.rq'
import N3 from 'n3'

const SP = 'http://spinrdf.org/sp'
const SPIN = `${SP}in#`

const templateType = 'http://vocab.rpi.edu/whyis/SparqlTemplate'
const typePred = RDF + 'type'

const MMPQ = 'http://materialsmine.org/explorer/parameterized_query/'

export async function loadSparqlTemplates () {
  // TODO: load templates via sparql query once they are present in whyis
  // Currently they are hardcoded as ttl files
  // const queryResponse = await querySparql(loadSparqlTemplatesQuery)
  // , {headers: {accept: "application/rdf+json"}})

  const templates = []
  for (const templateRdf of templateRdfStrs) {
    const store = new N3.Store()
    const parser = new N3.Parser()
    await parser.parse(templateRdf, (_, quad, prefixes) => {
      if (quad) {
        store.addQuad(quad)
      }
    })
    store.getSubjects(typePred, templateType)
      .map(tNode => buildTemplate(store, tNode))
      .forEach(template => templates.push(template))
  }
  templates.sort((a, b) => a.id > b.id ? 1 : -1)
  return templates
}

/**
 * Identifies segments of display text as being variables or text
 */
export const TextSegmentType = Object.freeze({
  VAR: 'var',
  TEXT: 'text'
})

/**
 * Enumeration of types of query parameter option values.
 */
export const OptValueType = Object.freeze({
  ANY: 'any',
  LITERAL: 'literal',
  IDENTIFIER: 'identifier'
})

function literalValue (lNode) {
  return fromRdf(literal(lNode.value, namedNode(lNode.datatypeString)))
}

function getSingletonObject (store, s, p, optional = false) {
  const objects = store.getObjects(s, p)
  if (optional && objects.length === 0) {
    return null
  }
  return objects[0]
}

function getSingletonLiteral (store, s, p, optional = false) {
  const object = getSingletonObject(store, s, p, optional)
  return object && literalValue(object)
}

function buildTemplate (store, tNode) {
  const displayText = getSingletonLiteral(store, tNode, `${SPIN}labelTemplate`)
  return {
    id: tNode.id,
    display: displayText,
    displaySegments: parseDisplayText(displayText),
    SPARQL: getSingletonLiteral(store, tNode, `${SP}text`),
    options: buildTemplateParams(store, tNode),
    replacements: buildTemplateReplacements(store, tNode),
    title: getSingletonLiteral(store, tNode, `${RDFS}label`),
  }
}

function buildTemplateReplacements (store, tNode) {
  return Object.fromEntries(
    store.getObjects(tNode, `${MMPQ}replacement`)
      .map(paramNode =>
        [getSingletonLiteral(store, paramNode, `${SP}varName`),
          {
            subVar: getSingletonLiteral(store, paramNode, `${MMPQ}subVar`),
            varFormat: getSingletonLiteral(store, paramNode, `${MMPQ}varFormat`)
          }]
      )
  )
}

function buildTemplateParams (store, tNode) {
  return Object.fromEntries(
    store.getObjects(tNode, `${SPIN}constraint`)
      .map(paramNode => [
        getSingletonLiteral(store, paramNode, `${SP}varName`),
        buildParamOpts(store, paramNode)
      ])
  )
}

function buildParamOpts (store, paramNode) {
  return Object.fromEntries(
    store.getObjects(paramNode, `${SCHEMA}option`)
      .map(optNode => [
        getSingletonLiteral(store, optNode, `${RDFS}label`),
        getOptValue(store, optNode),
        getSingletonLiteral(store, optNode, `${SCHEMA}position`)
      ])
      .sort((e1, e2) => (e1[2] > e2[2]) ? 1 : -1)
  )
}

function getOptValue (store, optNode) {
  let value = {
    type: OptValueType.ANY
  }
  const optVal = getSingletonLiteral(store, optNode, `${SCHEMA}value`, true)
  const optIdNode = getSingletonObject(store, optNode, `${SCHEMA}identifier`, true)
  if (optVal !== null) {
    value = {
      type: OptValueType.LITERAL,
      value: optVal
    }
  } else if (optIdNode !== null) {
    value = {
      type: OptValueType.IDENTIFIER,
      value: optIdNode.id
    }
  }
  return value
}

// Matches query variables in display text
const qVarRegex = /{\?([^}]+)}/g
// Matches query variables or the text between query variables
const segmentRegex = new RegExp(`${qVarRegex.source}|[^{]+`, 'g')

function parseDisplayText (displayText) {
  return displayText.match(segmentRegex).map(token => {
    let displaySegment
    const match = qVarRegex.exec(token)
    if (match) {
      displaySegment = {
        type: TextSegmentType.VAR,
        varName: match[1]
      }
    } else {
      displaySegment = {
        type: TextSegmentType.TEXT,
        text: token
      }
    }
    return displaySegment
  })
}
