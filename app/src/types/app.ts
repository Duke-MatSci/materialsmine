// Datasets
export interface FileItem {
  status?: string;
  file?: File;
  uri?: string;
  filename?: string;
  swaggerFilename?: string;
  name?: string;
  originalname?: string;
  accessUrl?: string;
  [key: string]: any;
}
