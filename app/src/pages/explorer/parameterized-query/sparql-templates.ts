import { literal, namedNode } from '@rdfjs/data-model';
import { fromRdf } from 'rdf-literal';
import { RDF, RDFS, SCHEMA } from '@/modules/common-namespaces';
import templateRdfStrs from './templates';
import N3 from 'n3';

const SP = 'http://spinrdf.org/sp';
const SPIN = `${SP}in#`;

const templateType = 'http://vocab.rpi.edu/whyis/SparqlTemplate';
const typePred = RDF + 'type';

const MMPQ = 'http://materialsmine.org/explorer/parameterized_query/';

/**
 * Identifies segments of display text as being variables or text
 */
export const TextSegmentType = Object.freeze({
  VAR: 'var',
  TEXT: 'text',
} as const);

/**
 * Enumeration of types of query parameter option values.
 */
export const OptValueType = Object.freeze({
  ANY: 'any',
  LITERAL: 'literal',
  IDENTIFIER: 'identifier',
} as const);

export type TextSegmentTypeValue = typeof TextSegmentType[keyof typeof TextSegmentType];
export type OptValueTypeValue = typeof OptValueType[keyof typeof OptValueType];

export interface TextSegment {
  type: TextSegmentTypeValue;
  text?: string;
  varName?: string;
}

export interface OptValue {
  type: OptValueTypeValue;
  value?: string | number;
}

export interface TemplateReplacement {
  subVar: string;
  varFormat: string;
}

export interface SparqlTemplate {
  id: string;
  display: string;
  displaySegments: TextSegment[];
  SPARQL: string;
  options: Record<string, Record<string, OptValue>>;
  replacements: Record<string, TemplateReplacement>;
}

export async function loadSparqlTemplates(): Promise<SparqlTemplate[]> {
  // TODO: load templates via sparql query once they are present in whyis
  // Currently they are hardcoded as ttl files
  // const queryResponse = await querySparql(loadSparqlTemplatesQuery)
  // , {headers: {accept: "application/rdf+json"}})

  const templates: SparqlTemplate[] = [];
  for (const templateRdf of templateRdfStrs) {
    const store = new N3.Store();
    const parser = new N3.Parser();
    await new Promise<void>((resolve, reject) => {
      parser.parse(templateRdf, (error, quad) => {
        if (error) {
          reject(error);
          return;
        }
        if (quad) {
          store.addQuad(quad);
        } else {
          resolve();
        }
      });
    });
    store
      .getSubjects(typePred, templateType, null)
      .map((tNode) => buildTemplate(store, tNode))
      .forEach((template) => templates.push(template));
  }
  templates.sort((a, b) => (a.id > b.id ? 1 : -1));
  return templates;
}

function literalValue(lNode: N3.Literal): string | number | boolean {
  return fromRdf(literal(lNode.value, namedNode(lNode.datatypeString)));
}

function getSingletonObject(
  store: N3.Store,
  s: N3.Term | string,
  p: N3.Term | string,
  optional = false
): N3.Term | null {
  const objects = store.getObjects(s, p, null);
  if (optional && objects.length === 0) {
    return null;
  }
  return objects[0];
}

function getSingletonLiteral(
  store: N3.Store,
  s: N3.Term | string,
  p: N3.Term | string,
  optional = false
): string | number | boolean | null {
  const object = getSingletonObject(store, s, p, optional);
  return object && object.termType === 'Literal' ? literalValue(object as N3.Literal) : null;
}

function buildTemplate(store: N3.Store, tNode: N3.Term): SparqlTemplate {
  const displayText = getSingletonLiteral(store, tNode, `${SPIN}labelTemplate`) as string;
  return {
    id: tNode.value,
    display: displayText,
    displaySegments: parseDisplayText(displayText),
    SPARQL: getSingletonLiteral(store, tNode, `${SP}text`) as string,
    options: buildTemplateParams(store, tNode),
    replacements: buildTemplateReplacements(store, tNode),
  };
}

function buildTemplateReplacements(
  store: N3.Store,
  tNode: N3.Term
): Record<string, TemplateReplacement> {
  return Object.fromEntries(
    store.getObjects(tNode, `${MMPQ}replacement`, null).map((paramNode) => [
      getSingletonLiteral(store, paramNode, `${SP}varName`) as string,
      {
        subVar: getSingletonLiteral(store, paramNode, `${MMPQ}subVar`) as string,
        varFormat: getSingletonLiteral(store, paramNode, `${MMPQ}varFormat`) as string,
      },
    ])
  );
}

function buildTemplateParams(
  store: N3.Store,
  tNode: N3.Term
): Record<string, Record<string, OptValue>> {
  return Object.fromEntries(
    store.getObjects(tNode, `${SPIN}constraint`, null).map((paramNode) => [
      getSingletonLiteral(store, paramNode, `${SP}varName`) as string,
      buildParamOpts(store, paramNode),
    ])
  );
}

function buildParamOpts(store: N3.Store, paramNode: N3.Term): Record<string, OptValue> {
  return Object.fromEntries(
    store
      .getObjects(paramNode, `${SCHEMA}option`, null)
      .map((optNode) => {
        const label = getSingletonLiteral(store, optNode, `${RDFS}label`) as string;
        const value = getOptValue(store, optNode);
        const position = getSingletonLiteral(store, optNode, `${SCHEMA}position`);
        return [label, value, position] as [string, OptValue, number];
      })
      .sort((e1, e2) => (e1[2] > e2[2] ? 1 : -1))
      .map(([label, value]) => [label, value])
  );
}

function getOptValue(store: N3.Store, optNode: N3.Term): OptValue {
  let value: OptValue = {
    type: OptValueType.ANY,
  };
  const optVal = getSingletonLiteral(store, optNode, `${SCHEMA}value`, true);
  const optIdNode = getSingletonObject(store, optNode, `${SCHEMA}identifier`, true);
  if (optVal !== null) {
    value = {
      type: OptValueType.LITERAL,
      value: optVal as string | number,
    };
  } else if (optIdNode !== null) {
    value = {
      type: OptValueType.IDENTIFIER,
      value: optIdNode.value,
    };
  }
  return value;
}

// Matches query variables in display text
const qVarRegex = /{\?([^}]+)}/g;
// Matches query variables or the text between query variables
const segmentRegex = new RegExp(`${qVarRegex.source}|[^{]+`, 'g');

function parseDisplayText(displayText: string): TextSegment[] {
  const segments = displayText.match(segmentRegex) || [];
  return segments.map((token) => {
    // Reset regex lastIndex for each iteration
    qVarRegex.lastIndex = 0;
    const match = qVarRegex.exec(token);
    if (match) {
      return {
        type: TextSegmentType.VAR,
        varName: match[1],
      };
    } else {
      return {
        type: TextSegmentType.TEXT,
        text: token,
      };
    }
  });
}
