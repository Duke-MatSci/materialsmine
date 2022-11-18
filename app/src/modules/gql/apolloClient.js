import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import VueApollo from 'vue-apollo'

export default (uri) => {
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

  const apolloClient = new ApolloClient({
    uri,
    link: authLink.concat(httpLink), // Chain auth token with the HttpLink
    cache: new InMemoryCache()
  })

  return new VueApollo({
    defaultClient: apolloClient
  })
}
