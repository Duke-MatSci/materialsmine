import { listNanopubs, postNewNanopub, deleteNanopub, lodPrefix } from './whyis-utils'
import store from '@/store'

const defaultDataset = {
  title: '',
  description: '',
  contactpoint: {
    '@type': 'schemaPerson',
    '@id': null,
    name: '',
    cpfirstname: '',
    cplastname: '',
    cpemail: ''
  },
  contributor: [],
  author: [],
  datepub: {
    '@type': 'date',
    '@value': ''
  },
  datemod: {
    '@type': 'date',
    '@value': ''
  },
  refby: [],
  distribution: {
    accessURL: null
  },
  depiction: {
    name: '',
    accessURL: null
  }
}

const dcat = 'http://w3.org/ns/dcat#'
const dct = 'http://purl.org/dc/terms/'
const vcard = 'http://www.w3.org/2006/vcard/ns#'
const foaf = 'http://xmlns.com/foaf/0.1/'
const schema = 'http://schema.org/'

const datasetFieldUris = {
  baseSpec: 'http://semanticscience.org/resource/hasValue',
  title: `${dct}title`,
  description: `${dct}description`,

  contactpoint: `${dcat}contactpoint`,
  cpemail: `${vcard}email`,
  cpfirstname: `${schema}givenName`,
  cplastname: `${schema}familyName`,
  individual: `${vcard}individual`,
  schemaperson: `${schema}Person`,

  author: `${dct}creator`,
  name: `${foaf}name`,
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
  accessURL: `${dcat}accessURL`
}

const datasetPrefix = 'dataset'

// Generate a randum uuid, or use current if exists
function generateDatasetId (guuid) {
  var datasetId
  if (arguments.length === 0) {
    const { v4: uuidv4 } = require('uuid')
    datasetId = uuidv4()
  } else {
    datasetId = guuid
  }
  return `${lodPrefix}/explorer/${datasetPrefix}/${datasetId}`
}

function buildDatasetLd (dataset) {
  dataset = Object.assign({}, dataset)
  dataset.context = JSON.stringify(dataset.context)
  const datasetLd = {
    '@id': dataset.uri,
    '@type': []
  }

  if (dataset['@type'] != null) {
    datasetLd['@type'].push(dataset['@type'])
  }

  Object.entries(dataset)
    // filter out the ones that aren't in our allowed fields
    .filter(([field, value]) => datasetFieldUris[field.toLowerCase()])
    .forEach(([field, value]) => {
      // make a new dictionary
      var ldValues = {}
      // If the field has a value
      if (!isEmpty(value)) {
        ldValues = recursiveFieldSetter([field, value])
        datasetLd[datasetFieldUris[field.toLowerCase()]] = ldValues
      }
    })
  return datasetLd
}

// Recursively check if a value is empty
function isEmpty (value) {
  // Base case
  if ([undefined, null, '', []].includes(value)) {
    return true
  } else if (Array.isArray(value)) {
    // Is empty if array has length 0
    let arrayEmpty = (value.length === 0)
    for (var val in value) {
      // if any entry in the array is empty, it's empty
      arrayEmpty = arrayEmpty || isEmpty(value[val])
    }
    return arrayEmpty
  } else if (typeof (value) === 'object') {
    let objEmpty = false
    for (var property in value) {
      // if any attribute of the object is empty, it's empty
      objEmpty = objEmpty || isEmpty(value[property])
    }
    return objEmpty
  }
  return false
}

// Helper for assigning values into JSON-LD format
function recursiveFieldSetter ([field, value]) {
  // If the value is also an array, recur through the value
  if (Array.isArray(value)) {
    var fieldArray = []
    for (const val in value) {
      fieldArray.push(recursiveFieldSetter([field, value[val]]))
    }
    return fieldArray
  } else {
    var fieldDict = {}
    // Fields may have multiple values, so loop through all
    for (const val in value) {
      // type, value and id aren't in datasetFieldURIs dictionary
      // but they are valid keys, so set the value to their value
      if (['@type', '@value', '@id'].includes(val)) {
        // if the value of val is an allowed field, use the field's value
        // e.g., type = organization, and organization -> foaf:Organization
        fieldDict[val] = Object.getOwnPropertyDescriptor(datasetFieldUris, value[val].toLowerCase())?.value ?? value[val]
      } else if (Object.getOwnPropertyDescriptor(datasetFieldUris, val.toLowerCase())) { // Recursive case (val is an allowed field)
        fieldDict[datasetFieldUris[val.toLowerCase()]] = recursiveFieldSetter([datasetFieldUris[val.toLowerCase()], value[val]])
      } else {
        fieldDict['@value'] = value
      }
    }
    return fieldDict
  }
}

// Blank dataset
function getDefaultDataset () {
  return Object.assign({}, defaultDataset)
}

function deleteDataset (datasetUri) {
  return listNanopubs(datasetUri)
    .then(nanopubs => {
      Promise.all(nanopubs.map(nanopub => deleteNanopub(nanopub.np)))
    }
    )
}

// Handle all of the uploads as multipart form
async function saveDataset (dataset, fileList, image, guuid) {
  let p = Promise.resolve()
  if (dataset.uri) {
    p = deleteDataset(dataset.uri)
  } else if (arguments.length === 1) {
    dataset.uri = generateDatasetId()
  } else {
    dataset.uri = generateDatasetId(guuid)
  }
  const [distrRes, imgRes] = await Promise.all([
    saveDatasetFiles(fileList),
    saveDatasetFiles([image]), // TODO: verify we want to use the same function for depiction
    p
  ])
  const datasetLd = buildDatasetLd(dataset)
  if (distrRes?.files?.length) {
    datasetLd[datasetFieldUris.distribution] = buildDistrLd(distrRes?.files)
  } if (imgRes?.files?.length) {
    datasetLd[datasetFieldUris.depiction] = buildDepictionLd(imgRes?.files?.[0], dataset.uri)
  } return postNewNanopub(datasetLd)
  // TODO: Error handling
}

async function saveDatasetFiles (fileList) {
  if (fileList.length) {
    const url = `${window.location.origin}/api/files/upload`
    const formData = new FormData()
    fileList.forEach((file) => formData.append('uploadfile', file?.file ?? file))
    const result = await fetch(url, {
      method: 'POST',
      body: formData,
      redirect: 'follow',
      headers: {
        Authorization: store.getters['auth/token']
      }
    })
    return await result.json()
    // TODO: Error handling
  }
}

function buildDistrLd (fileList) {
  const distrLDs = Array(fileList.length)
  Array
    .from(Array(fileList.length).keys())
    .map(x => {
      // TODO: check if we want to keep distribution uri as /explorer/dataset/id/filename and redirect for download
      distrLDs[x] = {
        '@id': `${window.location.origin}/api/files/get?filename=${fileList[x].filename}`,
        '@type': 'http://purl.org/net/provenance/ns#File',
        'http://www.w3.org/2000/01/rdf-schema#label': fileList[x].originalname
      }
    })
  return distrLDs
}

function buildDepictionLd (file, uri) {
  const depictionLd = {
    '@id': `${uri}/depiction`,
    '@type': 'http://purl.org/net/provenance/ns#File',
    'http://www.w3.org/2000/01/rdf-schema#label': file.originalname,
    'http://w3.org/ns/dcat#accessURL': `${window.location.origin}/api/files/get?filename=${file.filename}`
  }
  return depictionLd
}

const isValidOrcid = (identifier) => {
  return /^(\d{4}-){3}\d{3}(\d|X)$/.test(identifier)
}

export { getDefaultDataset, saveDataset, deleteDataset, isValidOrcid }
