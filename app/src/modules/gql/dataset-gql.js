import gql from 'graphql-tag'

export const VERIFY_AUTH_QUERY = gql`
  query verifyAuth {
  verifyUser {
    isAuth
    user {
      id
      username
    }
  }
}`

export const USER_DATASETS_QUERY = gql`
query GetUserDataset($input: datasetStatusInput) {
  getUserDataset(input: $input) {
    totalItems
    pageSize
    pageNumber
    totalPages
    hasNextPage
    hasPreviousPage
    datasets {
      datasetGroupId
      status
      title
      filesetInfo {
        filesetName
        files {
          id
          filename
          contentType
        }
      }
      createdAt
      updatedAt
    }
  }
}
`

export const USER_DATASET_IDS_QUERY = gql`
query userDatasetIds($input: datasetStatusInput) {
  getUserDataset(input: $input) {
    datasets {
      datasetGroupId
      updatedAt
      title
    }
  }
}
`

export const FILESET_QUERY = gql`
  query getFilesets($input: filesetQueryInput!) {
  getFilesets(input: $input) {
    ... on FilesetsGroup {
      totalItems
      filesets {
        files {
          id
          filename
          contentType
        }
        filesetName
      }
      pageSize
      pageNumber
      totalPages
      hasPreviousPage
      hasNextPage
    }
  }
}
`

export const CREATE_DATASET_ID_MUTATION = gql`
mutation CreateDatasetId {
  createDatasetId {
    datasetGroupId
    status
    createdAt
    updatedAt
    user {
      id
      username
    }
  }
}`

export const CREATE_DATASET_MUTATION = gql`
mutation CreateDataset($input: datasetInput) {
  createDataset(input: $input) {
    _id
    title
    doi
    datasetId
    userid
    filesets {
      filesetName
      files {
        id
        filename
        contentType
      }
    }
  }
}`
