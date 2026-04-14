import { listNanopubs, postNewNanopub, deleteNanopub, lodPrefix } from './whyis-utils';
import store from '@/store';
import { v4 as uuidv4 } from 'uuid';

interface ContactPoint {
  '@type': string;
  '@id': string | null;
  firstName: string;
  lastName: string;
  cpEmail: string;
}

interface DateField {
  '@type': string;
  '@value': string;
}

interface Depiction {
  name: string;
  accessURL: string | null;
}

interface Dataset {
  title: string;
  description: string;
  contactPoint: ContactPoint;
  creator: string;
  contributor: string[];
  organization: string[];
  datePub: DateField;
  dateMod: DateField;
  refby: string[];
  distribution: string[];
  depiction: Depiction;
  uri?: string;
  '@type'?: string;
  [key: string]: any;
}

interface FileItem {
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

const defaultDataset: Dataset = {
  title: '',
  description: '',
  contactPoint: {
    '@type': 'schemaPerson',
    '@id': null,
    firstName: '',
    lastName: '',
    cpEmail: '',
  },
  creator: '',
  contributor: [],
  organization: [],
  datePub: {
    '@type': 'date',
    '@value': '',
  },
  dateMod: {
    '@type': 'date',
    '@value': '',
  },
  refby: [],
  distribution: [],
  depiction: {
    name: '',
    accessURL: null,
  },
};

const dcat = 'http://www.w3.org/ns/dcat#';
const dct = 'http://purl.org/dc/terms/';
const vcard = 'http://www.w3.org/2006/vcard/ns#';
const foaf = 'http://xmlns.com/foaf/0.1/';
const schema = 'http://schema.org/';

const datasetFieldUris: Record<string, string> = {
  baseSpec: 'http://semanticscience.org/resource/hasValue',
  title: `${dct}title`,
  description: `${dct}description`,

  contactpoint: `${dcat}contactpoint`,
  cpemail: `${vcard}email`,
  firstname: `${schema}givenName`,
  lastname: `${schema}familyName`,
  individual: `${vcard}individual`,
  schemaperson: `${schema}Person`,

  name: `${foaf}name`,
  creator: `${dct}creator`,
  contributor: `${dct}contributor`,
  organization: `${foaf}Organization`,
  person: `${foaf}Person`,
  onbehalfof: 'http://www.w3.org/ns/prov#actedOnBehalfOf',
  specializationOf: 'http://www.w3.org/ns/prov#specializationOf',

  datepub: `${dct}issued`,
  datemod: `${dct}modified`,
  date: 'https://www.w3.org/2001/XMLSchema#date',

  refby: `${dct}isReferencedBy`,

  distribution: `${dcat}distribution`,
  depiction: `${foaf}depiction`,
  hasContent: 'http://vocab.rpi.edu/whyis/hasContent',
  accessURL: `${dcat}accessURL`,
};

const datasetPrefix = 'dataset';

// Generate a randum uuid, or use current if exists
function generateDatasetId(guuid?: string): string {
  let datasetId: string;
  if (arguments.length === 0) {
    datasetId = uuidv4();
  } else {
    datasetId = guuid!;
  }
  return `${lodPrefix}/explorer/${datasetPrefix}/${datasetId}`;
}

function buildDatasetLd(dataset: Dataset): Record<string, any> {
  dataset = Object.assign({}, dataset);
  dataset.context = JSON.stringify(dataset.context);
  const datasetLd: Record<string, any> = {
    '@id': dataset.uri,
    '@type': [],
  };

  if (dataset['@type'] != null) {
    datasetLd['@type'].push(dataset['@type']);
  }

  Object.entries(dataset)
    // filter out the ones that aren't in our allowed fields
    .filter(([field, value]) => datasetFieldUris[field.toLowerCase()])
    .forEach(([field, value]) => {
      // make a new dictionary
      let ldValues: any = {};
      // If the field has a value
      if (!isEmpty(value)) {
        ldValues = recursiveFieldSetter([field, value]);
        datasetLd[datasetFieldUris[field.toLowerCase()]] = ldValues;
      }
    });
  return datasetLd;
}

// Recursively check if a value is empty
function isEmpty(value: any): boolean {
  // Base case
  if ([undefined, null, ''].includes(value)) {
    return true;
  } else if (Array.isArray(value)) {
    // Is empty if array has length 0
    let arrayEmpty = value.length === 0;
    for (const val in value) {
      // if any entry in the array is empty, it's empty
      arrayEmpty = arrayEmpty || isEmpty(value[val]);
    }
    return arrayEmpty;
  } else if (typeof value === 'object') {
    let objEmpty = false;
    for (const property in value) {
      // if any attribute of the object is empty, it's empty
      objEmpty = objEmpty || isEmpty(value[property]);
    }
    return objEmpty;
  }
  return false;
}

// Helper for assigning values into JSON-LD format
function recursiveFieldSetter([field, value]: [string, any]): any {
  // If the value is also an array, recur through the value
  if (Array.isArray(value)) {
    const fieldArray: any[] = [];
    for (const val in value) {
      fieldArray.push(recursiveFieldSetter([field, value[val]]));
    }
    return fieldArray;
  } else {
    const fieldDict: Record<string, any> = {};
    // Fields may have multiple values, so loop through all
    for (const val in value) {
      // type, value and id aren't in datasetFieldURIs dictionary
      // but they are valid keys, so set the value to their value
      if (['@type', '@value', '@id'].includes(val)) {
        // if the value of val is an allowed field, use the field's value
        // e.g., type = organization, and organization -> foaf:Organization
        fieldDict[val] =
          Object.getOwnPropertyDescriptor(datasetFieldUris, value[val].toLowerCase())?.value ??
          value[val];
      } else if (Object.getOwnPropertyDescriptor(datasetFieldUris, val.toLowerCase())) {
        // Recursive case (val is an allowed field)
        fieldDict[datasetFieldUris[val.toLowerCase()]] = recursiveFieldSetter([
          datasetFieldUris[val.toLowerCase()],
          value[val],
        ]);
      } else {
        fieldDict['@value'] = value;
      }
    }
    return fieldDict;
  }
}

// Blank dataset
function getDefaultDataset(): Dataset {
  return Object.assign({}, defaultDataset);
}

// TODO: Remove duplicate resource deletions
// The function below is deprecated for the one below it
// function deleteDataset (datasetUri) {
//   return listNanopubs(datasetUri)
//     .then(nanopubs => {
//       Promise.all(nanopubs.map(nanopub => deleteNanopub(nanopub.np)))
//     }
//     )
// }
async function deleteResources(resourceURI: string): Promise<any> {
  return listNanopubs(resourceURI).then((nanopubs) => {
    if (!nanopubs || !nanopubs.length) return;
    return Promise.all(nanopubs.map(async (nanopub) => await deleteNanopub(nanopub.np)));
  });
}

// Handle all of the uploads as multipart form
async function saveDataset(
  dataset: Dataset,
  fileList: FileItem[],
  imageList: FileItem[],
  guuid?: string,
  externalSddLink?: string
): Promise<any> {
  const oldFiles = fileList.filter((file) => file.status === 'complete');
  const oldDepiction = imageList.filter((file) => file.status === 'complete');
  const imgToDelete = imageList.filter((file) => file.status === 'delete')?.[0]?.accessUrl;
  let imgDeleteId: string | undefined;
  if (imgToDelete) imgDeleteId = parseFileName(imgToDelete, true);

  let p: Promise<any> = Promise.resolve();
  if (dataset.uri) {
    p = await deleteResources(dataset.uri);
  } else if (arguments.length === 1) {
    dataset.uri = generateDatasetId();
  } else {
    dataset.uri = generateDatasetId(guuid);
  }
  const [distrRes, imgRes] = await Promise.all([
    saveDatasetFiles(fileList.filter((file) => file.status === 'incomplete')),
    saveDatasetFiles(imageList.filter((file) => file.status === 'incomplete')),
    deleteFile(imgDeleteId),
    p,
  ]);
  const datasetLd = buildDatasetLd(dataset);
  let allFiles = [...oldFiles];
  if (distrRes?.files) allFiles = [...allFiles, ...distrRes.files];
  if (externalSddLink) {
    allFiles.push({ uri: externalSddLink, name: parseFileName(externalSddLink), status: 'complete' });
  }
  if (allFiles?.length) {
    datasetLd[datasetFieldUris.distribution] = buildDistrLd(allFiles);
  }

  if (imgRes?.files?.length) {
    datasetLd[datasetFieldUris.depiction] = buildDepictionLd(imgRes?.files?.[0], dataset.uri!);
  } else if (oldDepiction.length) {
    datasetLd[datasetFieldUris.depiction] = buildDepictionLd(oldDepiction[0], dataset.uri!);
  }

  try {
    return await postNewNanopub(datasetLd);
  } catch (err) {
    const uploadedFiles: FileItem[] = [];
    if (distrRes?.files) uploadedFiles.push(...distrRes.files);
    if (imgRes?.files) uploadedFiles.push(...imgRes.files);

    await Promise.allSettled(
      uploadedFiles.map((file) => {
        const fileId = parseFileName(file.filename || '', true);
        return deleteFile(fileId);
      })
    );

    throw err;
  }
}

async function saveDatasetFiles(fileList: FileItem[]): Promise<any> {
  if (fileList.length) {
    const url = `${window.location.origin}/api/files/upload`;
    const formData = new FormData();
    fileList.forEach((file) => formData.append('uploadfile', file?.file ?? (file as any)));
    const result = await fetch(url, {
      method: 'POST',
      body: formData,
      redirect: 'follow',
      headers: {
        Authorization: 'Bearer ' + store.getters['auth/token'],
      },
    });
    return await result.json();
    // TODO: Error handling
  }
}

async function deleteFile(fileId?: string): Promise<Response | undefined> {
  if (fileId) {
    const response = await fetch(`${window.location.origin}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${store.getters['auth/token']}`,
      },
    });
    if (response?.statusText !== 'OK') {
      const error = new Error(
        (response as any)?.message || 'Something went wrong while deleting file'
      );
      throw error;
    }
    return response;
  }
}

function buildDistrLd(fileList: FileItem[]): any[] {
  const distrLDs: any[] = Array(fileList.length);
  Array.from(Array(fileList.length).keys()).map((x) => {
    // TODO: check if we want to keep distribution uri as /explorer/dataset/id/filename and redirect for download
    const fileName = fileList[x]?.swaggerFilename ?? fileList[x]?.name;
    distrLDs[x] = {
      '@type': 'http://purl.org/net/provenance/ns#File',
      'http://www.w3.org/2000/01/rdf-schema#label': fileName,
    };
    if (fileList[x]?.status === 'complete') {
      distrLDs[x]['@id'] = fileList[x].uri;
    } else {
      distrLDs[x]['@id'] = `${window.location.origin}${fileList[x].filename}`;
    }

    // Note: When testing SDD linking locally enable below logic and comment above if statement
    // if (fileList[x]?.status === 'complete') {
    //   distrLDs[x]['@id'] = fileList[x].uri
    // } else {
    //   distrLDs[x]['@id'] = `http://restful:3001/${
    //     fileList[x].filename?.split('/api/')?.[1]
    //   }`
    // }
  });
  return distrLDs;
}

function buildDepictionLd(file: FileItem, uri: string): Record<string, any> {
  const depictionLd: Record<string, any> = {
    '@id': `${uri}/depiction`,
    '@type': 'http://purl.org/net/provenance/ns#File',
    'http://www.w3.org/2000/01/rdf-schema#label': file?.swaggerFilename ?? file.originalname,
    'http://www.w3.org/ns/dcat#accessURL':
      file?.accessUrl ?? `${window.location.origin}${file.filename}`,
  };
  return depictionLd;
}

// Load for editing
async function loadDataset(datasetUri: string): Promise<[Dataset, FileItem[], any] | undefined> {
  try {
    const response = await store.dispatch('explorer/fetchSingleDataset', datasetUri);
    const [extractedDataset, oldDistributions, oldDepiction] = extractDataset(response);
    return [extractedDataset, oldDistributions, oldDepiction];
  } catch (e: any) {
    store.commit('setSnackbar', { message: e });
  }
}

// Extract information from dataset in JSONLD format
function extractDataset(datasetLd: Record<string, any>): [Dataset, FileItem[], any] {
  // eslint-disable-next-line no-undef
  const dataset: Dataset = structuredClone(defaultDataset);
  dataset.uri = datasetLd?.['@id'];
  let oldDistributions: FileItem[] = [];
  let oldDepiction: any;

  Object.entries(defaultDataset).forEach(([field]) => {
    const uri = datasetFieldUris?.[field.toLowerCase()];
    const val = datasetLd?.[uri];
    if (!!uri && typeof val !== 'undefined') {
      if (field === 'distribution') {
        oldDistributions = val.map((fileId: any) => {
          return {
            uri: fileId['@id'],
            name: parseFileName(fileId['@id']),
          };
        });
      } else if (field === 'depiction') oldDepiction = val;
      else if (Array.isArray(defaultDataset[field]) && Array.isArray(val)) {
        dataset[field] = val.map((entry: any) => {
          return entry?.['@value'] ?? entry;
        });
      } else if (typeof defaultDataset[field] === 'object') {
        Object.entries(defaultDataset[field]).forEach(([subfield]) => {
          if (typeof val?.[0]?.[subfield] !== 'undefined') {
            dataset[field][subfield] = val?.[0]?.[subfield];
          }
        });
      } else if (typeof val[0]['@value'] !== 'undefined') {
        dataset[field] = datasetLd[uri][0]['@value'];
      }
    }
  });
  return [dataset, oldDistributions, oldDepiction];
}

// For extracting the original file name from the URI
function parseFileName(fileString: string, fullId = false): string {
  const dateString = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)-/;
  let parsed: string;
  if (fullId) parsed = fileString.split('api/files/').pop()!;
  else parsed = fileString.split(dateString).pop()!;
  return parsed.split('?')[0];
}

const isValidOrcid = (identifier: string): boolean => {
  return /^(\d{4}-){3}\d{3}(\d|X)$/.test(identifier);
};

export {
  getDefaultDataset,
  saveDataset,
  deleteResources,
  deleteFile,
  loadDataset,
  isValidOrcid,
  parseFileName,
};
