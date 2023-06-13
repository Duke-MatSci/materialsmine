import gql from 'graphql-tag'

export const CONTACT_US_QUERY = gql`
  mutation Mutation($input: createContactInput!) {
  submitContact(input: $input) {
    _id
    fullName
    email
    purpose
    message
    createdAt
    updatedAt
  }
}
`

export const CONTACT_INQUIRY_QUERY = gql`
  query Query($input: contactsQueryInput) {
    contacts(input: $input) {
      totalItems
      pageSize
      pageNumber
      totalPages
      hasPreviousPage
      hasNextPage
      data {
        _id
        fullName
        email
        purpose
        message
        resolved
        response
        createdAt
        updatedAt
        resolvedBy
      }
    }
  }
`

export const CONTACT_UPDATE_QUERY = gql`
  mutation Mutation($input: updateContactInput!) {
    updateContact(input: $input) {
      _id
      fullName
      email
      purpose
      message
      resolved
      response
      createdAt
      updatedAt
      resolvedBy
    }
  }
`