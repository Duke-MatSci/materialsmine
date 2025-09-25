import gql from 'graphql-tag'

export const METAMATERIAL_QUERY = gql`
	query PixelData($input: pixelDataQueryInput!) {
  pixelData(input: $input) {
    totalItems
    data {
      symmetry
      unit_cell_x_pixels
      C11
      C12
      C22
      C16
      C26
      C66
      CM0
      CM0_C11
      CM0_C12
      CM0_C22
      CM0_C16
      CM0_C26
      CM0_C66
      CM1
      CM1_C11
      CM1_C12
      CM1_C22
      CM1_C16
      CM1_C26
      CM1_C66
      geometry_full
    }
  }
}`
