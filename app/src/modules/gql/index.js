import ApolloClient from 'apollo-boost';
const BASE = process.env.SERVICE_PORT || 'http://localhost:3001'
const uri = `${BASE}/api/graphql`;
export default gqlClient = new ApolloClient({
  uri
});