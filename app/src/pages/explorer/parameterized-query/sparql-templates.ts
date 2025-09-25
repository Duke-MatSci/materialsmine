import { literal, namedNode } from '@rdfjs/data-model';
import { fromRdf } from 'rdf-literal';
import { RDF } from '@/modules/common-namespaces';
import templateRdfStrs from './templates';
import N3 from 'n3';

const SP = 'http://spinrdf.org/sp';
const SPIN = `${SP}in#`;

const templateType = 'http://vocab.rpi.edu/whyis/SparqlTemplate';
const typePred = RDF + 'type';

const MMPQ = 'http://materialsmine.org/explorer/parameterized_query/';

interface Template {
  id: string;
  display: string;
  displaySegments: any[];
  SPARQL: string;
  options: Record<string, any>;
  replacements: Record<string, any>;
}

export async function loadSparqlTemplates(): Promise<Template[]> {
  // TODO: load templates via sparql query once they are present in whyis
  // Currently they are hardcoded as ttl files
  // const queryResponse = await querySparql(loadSparqlTemplatesQuery)
  // , {headers: {accept: "application/rdf+json"}})

  const templates: Template[] = [];
  for (const templateRdf of templateRdfStrs) {
    const store = new N3.Store();
    const parser = new N3.Parser();
    await parser.parse(templateRdf, (error: any, quad: any, prefixes: any) => {
      if (quad) {
        store.addQuad(quad);
      }
    });
    (store as any)
      .getSubjects(typePred, templateType)
      .map((tNode: any) => buildTemplate(store, tNode))
      .forEach((template: any) => templates.push(template));
  }
  templates.sort((a, b) => (a.id > b.id ? 1 : -1));
  return templates;
}

/**
 * Identifies segments of display text as being variables or text
 */
export const TextSegmentType = Object.freeze({
  VAR: 'var',
  TEXT: 'text',
});

/**
 * Enumeration of types of query parameter option values.
 */
export const OptValueType = Object.freeze({
  ANY: 'any',
  LITERAL: 'literal',
  IDENTIFIER: 'identifier',
});

function literalValue(lNode: any) {
  return fromRdf(literal(lNode.value, namedNode(lNode.datatypeString)));
}

function getSingletonObject(store: any, s: any, p: string, optional = false) {
  const objects = store.getObjects(s, p);
  if (optional && objects.length === 0) {
    return null;
  }
  return objects[0];
}

function getSingletonLiteral(store: any, s: any, p: string, optional = false) {
  const object = getSingletonObject(store, s, p, optional);
  return object && literalValue(object);
}

function buildTemplate(store: any, tNode: any) {
  const displayText = getSingletonLiteral(store, tNode, `${SPIN}labelTemplate`);
  return {
    id: tNode.id,
    display: displayText,
    displaySegments: parseDisplayText(displayText),
    SPARQL: getSingletonLiteral(store, tNode, `${SP}text`),
    options: buildTemplateParams(store, tNode),
    replacements: buildTemplateReplacements(store, tNode),
  };
}

function buildTemplateReplacements(store: any, tNode: any) {
  return Object.fromEntries(
    store.getObjects(tNode, `${MMPQ}replacement`).map((paramNode: any) => [
      getSingletonLiteral(store, paramNode, `${SP}varName`),
      {
        subVar: getSingletonLiteral(store, paramNode, `${MMPQ}subVar`),
        varFormat: getSingletonLiteral(store, paramNode, `${MMPQ}varFormat`),
      },
    ])
  );
}

function buildTemplateParams(store: any, tNode: any) {
  return Object.fromEntries(
    store
      .getObjects(tNode, `${SP}arg`)
      .map((paramNode: any) => [
        getSingletonLiteral(store, paramNode, `${SP}varName`),
        buildParamOptions(store, paramNode),
      ])
  );
}

function buildParamOptions(store: any, paramNode: any) {
  return Object.fromEntries(
    store.getObjects(paramNode, `${SPIN}option`).map((optNode: any) => [
      getSingletonLiteral(store, optNode, `${SPIN}value`),
      {
        type: getSingletonLiteral(store, optNode, `${SPIN}type`),
        value: getSingletonLiteral(store, optNode, `${SPIN}value`),
      },
    ])
  );
}

function parseDisplayText(displayText: string) {
  const segments = [];
  let currentSegment = '';
  let inVar = false;
  let varName = '';

  for (let i = 0; i < displayText.length; i++) {
    const char = displayText[i];
    if (char === '{' && displayText[i - 1] === '$') {
      // Start of variable
      inVar = true;
      currentSegment = currentSegment.slice(0, -1); // Remove the $
      if (currentSegment) {
        segments.push({
          type: TextSegmentType.TEXT,
          text: currentSegment,
        });
      }
      currentSegment = '';
    } else if (char === '}' && inVar) {
      // End of variable
      inVar = false;
      segments.push({
        type: TextSegmentType.VAR,
        varName: varName,
      });
      varName = '';
    } else if (inVar) {
      varName += char;
    } else {
      currentSegment += char;
    }
  }

  if (currentSegment) {
    segments.push({
      type: TextSegmentType.TEXT,
      text: currentSegment,
    });
  }

  return segments;
}
