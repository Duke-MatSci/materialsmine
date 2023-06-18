import { listNanopubs, postNewNanopub, deleteNanopub } from './whyis-utils'
const lodPrefix = window.location.hostname
const defaultDataset = {
  title: '',
  description: '',
  contactpoint: {
    '@type': 'individual',
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

const datasetFieldUris = {
  baseSpec: 'http://semanticscience.org/resource/hasValue',
  title: `${dct}title`,
  description: `${dct}description`,

  contactpoint: `${dcat}contactpoint`,
  cpemail: `${vcard}email`,
  cpfirstname: `${vcard}given-name`,
  cplastname: `${vcard}family-name`,
  individual: `${vcard}individual`,

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

  // distribution: `${dcat}distribution`,
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
  return `${lodPrefix}/${datasetPrefix}/${datasetId}`
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
  if ((value === '') || (value === null) || (value === []) || (value === 'undefined')) {
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
      if ((val === '@type') || (val === '@value') || (val === '@id')) {
        fieldDict[val] = value[val]
        // but if the value of val is an allowed field, use the field's value
        // e.g., type = organization, and organization -> foaf:Organization
        if (Object.prototype.hasOwnProperty.call(datasetFieldUris, value[val].toLowerCase())) {
          fieldDict[val] = datasetFieldUris[value[val].toLowerCase()]
        }
      } else if (Object.prototype.hasOwnProperty.call(datasetFieldUris, val.toLowerCase())) { // Recursive case (val is an allowed field)
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
      console.log('deleting nanopubs: ', nanopubs.np)
      Promise.all(nanopubs.map(nanopub => deleteNanopub(nanopub.np)))
    }
    )
}

// TODO: Refactor for current system
// Should handle all of the uploads as multipart form
async function saveDataset (dataset, guuid) {
  let p = Promise.resolve()
  if (dataset.uri) {
    p = deleteDataset(dataset.uri)
  } else if (arguments.length === 1) {
    dataset.uri = generateDatasetId()
  } else {
    dataset.uri = generateDatasetId(guuid)
  }
  const datasetLd = buildDatasetLd(dataset)
  await p
  try {
    console.log(datasetLd)
    return postNewNanopub(datasetLd)
  } catch (err) {
    return alert(err)
  }
}

// TODO: Refactor for current system -- This should happen as part of the save dataset call
async function saveDistribution (fileList, id) {
  const distrData = new FormData()
  const distrLDs = Array(fileList.length)
  // Specify is a dataset so handles multiple files
  distrData.append('upload_type', 'http://www.w3.org/ns/dcat#Dataset')

  // append the files to FormData
  Array
    .from(Array(fileList.length).keys())
    .map(x => {
      distrData.append(fileList[x].label, fileList[x])
      distrLDs[x] = {
        '@id': `${lodPrefix}/dataset/${id}/${fileList[x].name.replace(/ /g, '_')}`,
        'http://www.w3.org/2000/01/rdf-schema#label': fileList[x].label
      }
    })

  /// / Where to save the distribution
  // const uri = `${lodPrefix}/dataset/${id}`
  /// / TODO: This is the wrong url
  // const baseUrl = `${window.location.origin}/about?uri=${uri}`
  /// / TODO: This shouldn't be using axios
  // axios.post(baseUrl,
  //   distrData,
  //   {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   }
  // )
  // Array
  //   .from(Array(fileList.length).keys())
  //   .map(x => {
  //     if (distrLDs[x]['http://www.w3.org/2000/01/rdf-schema#label'] !== '') {
  //       postNewNanopub(distrLDs[x])
  //     }
  //   })
}

// TODO: Refactor for current system -- This should happen as part of the save dataset call
async function saveImg (file, id) {
  // Where to save the image
  const uri = `${lodPrefix}/dataset/${id}/depiction`
  // TODO: This is the wrong URL
  const baseUrl = `${window.location.origin}/about?uri=${uri}`

  const form = new FormData()
  form.append('upload_type', 'http://purl.org/net/provenance/ns#File')
  form.append('depiction', file)

  var data = {
    '@id': uri,
    file: form
  }

  await fetch(baseUrl, {
    method: 'POST',
    body: data,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data'
    }
  })
  return [uri, baseUrl]
}

export { getDefaultDataset, saveDataset, deleteDataset, saveDistribution, saveImg }
