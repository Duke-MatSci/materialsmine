import { querySparql } from './sparql';

const lodPrefix = window.location.origin;

const deleteNanopub = async (uri: string): Promise<any> => {
  return await querySparql('', {
    method: 'DELETE',
    whyisPath: `about?uri=${encodeURIComponent(uri)}`,
  });
};

function makeNanopubId(): string {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return Math.random().toString(36).substr(2, 10);
}

interface Nanopub {
  np: string;
  [key: string]: any;
}

async function listNanopubs(uri: string): Promise<Nanopub[]> {
  const response = await querySparql('', {
    whyisPath: `about?view=nanopublications&uri=${encodeURIComponent(uri)}`,
  });
  return Object.values(response);
}

interface NanopubData {
  '@context'?: Record<string, any>;
  '@id': string;
  '@graph': {
    '@id': string;
    '@type': string;
    'np:hasAssertion': {
      '@id': string;
      '@type': string;
      '@graph': any[];
    };
    'np:hasProvenance': {
      '@id': string;
      '@type': string;
      '@graph': {
        '@id': string;
      };
    };
    'np:hasPublicationInfo': {
      '@id': string;
      '@type': string;
      '@graph': {
        '@id': string;
      };
    };
  };
}

const postNewNanopub = async (
  pubData: any,
  isXSD?: boolean,
  context?: Record<string, any>
): Promise<NanopubData> => {
  let nanopub: NanopubData;
  if (!isXSD) {
    nanopub = getNanopubSkeleton();
    if (context) {
      nanopub['@context'] = { ...nanopub['@context'], ...context };
    }
    nanopub['@graph']['np:hasAssertion']['@graph'].push(pubData);
  } else {
    nanopub = pubData;
  }

  // This returns an empty response body from Whyis & Fuseki.
  // Ignore response as long as its not an error.
  await querySparql('', {
    body: nanopub,
    method: 'POST',
    whyisPath: 'pub',
    headers: { 'Content-Type': 'application/json' },
  });
  return nanopub;
};

function getNanopubSkeleton(): NanopubData {
  // doot
  const npId = `${lodPrefix}/pub/${makeNanopubId()}`; // make sure this change doesn't break other things
  return {
    '@context': {
      '@vocab': lodPrefix + '/',
      '@base': lodPrefix + '/',
      np: 'http://www.nanopub.org/nschema#',
    },
    '@id': npId,
    '@graph': {
      '@id': npId,
      '@type': 'np:Nanopublication',
      'np:hasAssertion': {
        '@id': npId + '_assertion',
        '@type': 'np:Assertion',
        '@graph': [],
      },
      'np:hasProvenance': {
        '@id': npId + '_provenance',
        '@type': 'np:Provenance',
        '@graph': {
          '@id': npId + '_assertion',
        },
      },
      'np:hasPublicationInfo': {
        '@id': npId + '_pubinfo',
        '@type': 'np:PublicationInfo',
        '@graph': {
          '@id': npId,
        },
      },
    },
  };
}

export { deleteNanopub, makeNanopubId, postNewNanopub, listNanopubs, lodPrefix };
