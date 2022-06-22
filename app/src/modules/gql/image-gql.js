import gql from 'graphql-tag';

export const IMAGES_QUERY = gql`
  query getAllImages($input: imageQueryInput) {
    images(input: $input) {
      totalItems
			pageSize
			pageNumber
			totalPages
			hasPreviousPage
			hasNextPage
			images {
			file
			description
			microscopyType
			type
			dimension {
				width
				height
			}
			metaData {
				title
				doi
				id
				keywords
			}
		}
  }
`;