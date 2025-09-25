// Metamaterial constants that can be used across the application

export const METAMATERIAL_COLUMNS = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'] as const;

export const METAMATERIAL_REQUIRED_COLUMNS = [
  'symmetry',
  'unit_cell_x',
  'unit_cell_y',
  'geometry_full',
  'C11',
  'C12',
  'C22',
  'C16',
  'C26',
  'C66',
] as const;

export const METAMATERIAL_COLORS = [
  '#FFB347',
  '#8A8BD0',
  '#FFC0CB',
  '#6FA8DC',
  '#8FCE00',
  '#CC0000',
  '#38761D',
  '#9FC5E8',
  '#2f3b45',
  '#e8c29f',
] as const;

export const NEAREST_NEIGHBOR_COLORS = [
  '#EA1A7F',
  '#FEC603',
  '#A8F387',
  '#16D6FA',
  '#6020a4',
] as const;

// S3 bucket configuration for data sources
export interface S3BucketConfig {
  name: string;
  bucket_name: string;
  file_name: string;
  color: string;
}

export const S3_BUCKET_CONFIGS: S3BucketConfig[] = [
  {
    name: 'lattice 2D',
    bucket_name: 'ideal-dataset-1',
    file_name: 'lattice_2d.csv',
    color: '#FFB347',
  },
  // Additional configurations can be uncommented as needed:
  // {
  //   name: "free form 2D",
  //   bucket_name: "ideal-dataset-1",
  //   file_name: "freeform_2d.csv",
  //   color: "#8A8BD0",
  // },
  // {
  //   name: "large dataset",
  //   bucket_name: "ideal-dataset-1",
  //   file_name: "large_dataset_cleaned.csv",
  //   color: "#FFC0CB"
  // }
];

// File upload configuration
export const ALLOWED_FILE_TYPES = ['csv', 'tsv', 'tab-separated-values', 'plain'] as const;

// Default values for visualization
export const DEFAULT_QUERY_VALUES = {
  query1: 'C11',
  query2: 'C12',
} as const;

// Grid configuration
export const GRID_OPTIONS = [
  { attr: 'TEN', label: '10 by 10' },
  { attr: 'FIFTY', label: '50 by 50' },
] as const;
