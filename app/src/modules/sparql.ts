import { literal, namedNode } from '@rdfjs/data-model';
import { fromRdf } from 'rdf-literal';
import store from '@/store';

const SPARQL_ENDPOINT = '/api/knowledge/sparql';

interface QuerySparqlOptions {
  endpoint?: string;
  headers?: Record<string, string>;
  body?: any;
  method?: string;
  whyisPath?: string;
}

interface SparqlResponse {
  results?: {
    bindings?: Array<Record<string, any>>;
  };
  [key: string]: any;
}

// Todo (ticket xx): Remove endpoint from function arg and update refactor code everywhere
async function querySparql(
  query: string,
  {
    endpoint = SPARQL_ENDPOINT,
    headers = {},
    body = null,
    method = 'GET',
    whyisPath = undefined
  }: QuerySparqlOptions = {}
): Promise<SparqlResponse> {
  let urlEncodedQuery = `${endpoint}?output=json`;
  if (query) {
    urlEncodedQuery = `${endpoint}?query=${encodeURIComponent(
      query
    )}&output=json`;
  }

  // Get user Token
  const token = store.getters['auth/token'];
  const requestOptions: RequestInit = {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      accept: 'application/sparql-results+json',
      ...headers
    }
  };

  if (whyisPath) {
    urlEncodedQuery = `${urlEncodedQuery}&whyisPath=${encodeURIComponent(whyisPath)}`;
  }

  if (body) {
    requestOptions.body = JSON.stringify({ ...body });
  }

  const res = await fetch(urlEncodedQuery, requestOptions);

  if (res.status !== 200) throw new Error((res as any).message || 'Server error, please try again');

  const results = await res.json();
  return results;
}

function parseSparql(response: SparqlResponse): Array<Record<string, any>> {
  const queryResults: Array<Record<string, any>> = [];

  if (!response || !response.results || !response.results.bindings) return queryResults;

  for (const row of response.results.bindings) {
    const rowData: Record<string, any> = {};
    queryResults.push(rowData);
    Object.entries(row).forEach(([field, result]) => {
      let value = result.value;
      if (result.type === 'literal' && result.datatype) {
        value = fromRdf(literal(value, namedNode(result.datatype)));
      }
      rowData[field] = value;
    });
  }
  return queryResults;
}

async function queryAndParseSparql(query: string, endpoint: string = SPARQL_ENDPOINT): Promise<Array<Record<string, any>>> {
  return parseSparql(await querySparql(query, { endpoint }));
}

export { querySparql, parseSparql, queryAndParseSparql }; // queryAndParseSparql as default ?
