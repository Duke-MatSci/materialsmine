import gql from 'graphql-tag'

export const CREATEMATERIAL_QUERY = gql`
mutation CreateXlsxCurationList($input: materialsInput) {
  createXlsxCurationList(input: $input) {
    columns {
      field
      values
      user
    }
  }
}`

export const SEARCH_SPREADSHEETLIST_QUERY = gql`
query GetXlsxCurationList($input: materialQueryInput) {
  getXlsxCurationList(input: $input) {
    totalItems
    pageSize
    pageNumber
    totalPages
    hasPreviousPage
    hasNextPage
    columns {
      field
      values
      user
    }
  }
}`

export const UPDATE_SPREADSHEETLIST = gql`
mutation UpdateXlsxCurationList($input: columnsInput) {
  updateXlsxCurationList(input: $input) {
    field
    values
    user
  }
}`
