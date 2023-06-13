import gql from 'graphql-tag'

export const USERS_QUERY = gql`
query User($input: usersQueryInput) {
  users(input: $input) {
    totalItems
    pageSize
    pageNumber
    totalPages
    hasPreviousPage
    hasNextPage
    data {
      _id
      alias
      givenName
      surName
      displayName
      email
      apiAccess
    }
  }
} 
`
export const DELETE_USERS_QUERY = gql`
mutation DeleteUser($input: deleteUsersInput) {
  deleteUser(input: $input)
}
`
