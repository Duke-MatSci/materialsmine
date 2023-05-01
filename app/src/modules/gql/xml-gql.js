import gql from 'graphql-tag'

export const XML_FINDER = gql`
query XmlFinder($input: xmlFinderInput) {
  xmlFinder(input: $input) {
    totalItems
    pageSize
    pageNumber
    totalPages
    hasPreviousPage
    hasNextPage
    xmlData {
      id
      title
      entityState
      sequence
    }
  }
}
`
export const XML_VIEWER = gql`
query XmlViewer($input: xmlViewerInput) {
  xmlViewer(input: $input) {
    id
    title
    xmlString
  }
}
`
