import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  HttpLink,
  Observable,
  from,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { isTokenExpired, forceLogout } from '../auth-utils';

const BASE = window.location.origin;
const uri = `${BASE}/api/graphql`;
const httpLink = new HttpLink({ uri });

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token') || null;

  if (token && isTokenExpired(token)) {
    forceLogout();
    return new Observable((observer) => {
      observer.error(new Error('Token expired'));
      observer.complete();
    });
  }

  operation.setContext({
    headers: {
      authorization: token ? `${token}` : '',
    },
  });
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const authMessages = ['not authenticated', 'jwt expired', 'invalid token', 'jwt malformed'];

  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const msg = (err.message || '').toLowerCase();
      if (authMessages.some((keyword) => msg.includes(keyword))) {
        forceLogout();
        return;
      }
    }
  }

  if (networkError && 'statusCode' in networkError) {
    const status = (networkError as any).statusCode;
    if (status === 401 || status === 403) {
      forceLogout();
    }
  }
});

export default new ApolloClient({
  uri: uri,
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
