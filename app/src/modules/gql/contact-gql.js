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
