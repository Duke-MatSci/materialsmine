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
  query userDatasets {
  getUserDataset {
    totalItems
    datasets {
    datasetGroupId
      userDatasetInfo {
        datasetId
        datasets {
        filesetName
        }
      }
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
mutation CreateDatasetId{
  createDatasetId {
    datasetGroupId
    status
    createdAt
    updatedAt
    userDatasetInfo {
      datasetId
      datasets {
        filesetName
        files {
          id
          filename
          contentType
        }
      }
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
