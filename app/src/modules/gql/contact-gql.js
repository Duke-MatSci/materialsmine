import gql from 'graphql-tag'

export const CONTACT_US_QUERY = gql`
  query submitContact(input: createContactInput!) {
    _id
    fullname
    email
    purpose
    message
    createdAt
    updatedAt
  }
`
