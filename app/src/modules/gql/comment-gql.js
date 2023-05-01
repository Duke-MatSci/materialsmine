import gql from 'graphql-tag'

export const LOAD_COMMENTS = gql`
query LoadComment($input: loadCommentInput!) {
  loadComment(input: $input) {
    totalItems
    pageSize
    pageNumber
    totalPages
    hasPreviousPage
    hasNextPage
    comments {
      _id
      comment
      user {
        givenName
        surName
        displayName
      }
      createdAt
      updatedAt
    }
  }
}
`

export const POST_COMMENT = gql`
mutation PostComment($input: postCommentInput) {
  postComment(input: $input) {
    _id
    comment
    user {
      givenName
      surName
      displayName
    }
    createdAt
    updatedAt
  }
}
`

export const EDIT_COMMENT = gql`
mutation EditComment($input: editCommentInput!) {
  editComment(input: $input) {
    _id
    comment
    user {
      givenName
      surName
      displayName
    }
    createdAt
    updatedAt
  }
}
`
