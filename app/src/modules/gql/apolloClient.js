import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'

// NOTE: Putting BASE and uri here instead of in main still works,
// and removes need for passing as variable
const BASE = window.location.origin
const uri = `${BASE}/api/graphql`
const httpLink = new HttpLink({ uri })
const authLink = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  const token = localStorage.getItem('token') || null
  operation.setContext({
    headers: {
      authorization: token ? `${token}` : ''
    }
  })
  return forward(operation)
})

export default new ApolloClient({
  uri: uri,
  link: authLink.concat(httpLink), // Chain auth token with the HttpLink
  cache: new InMemoryCache()
})
