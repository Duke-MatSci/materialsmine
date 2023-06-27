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
      roles
    }
  }
} 
`
export const DELETE_USERS_QUERY = gql`
mutation DeleteUser($input: deleteUsersInput) {
  deleteUser(input: $input)
}
`
export const UPDATE_USER_QUERY = gql`
mutation UpdateUser($input: updateUserInput) {
  updateUser(input: $input) {
    _id
    alias
    givenName
    surName
    displayName
    email
    apiAccess
    roles
  }
}
`
