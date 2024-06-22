const { datasetTransform, filesetsTransform } = require('./datasets');

const transformMetaData = (el) => {
  const metaData = el || {};
  metaData.keywords =
    typeof el?.keywords === 'object'
      ? el.keywords
      : typeof el?.keywords === 'string'
      ? el.keywords.split(',')
      : [];

  metaData.sampleID = el.sampleId ? el.sampleId.split('.')[0] : undefined;
  return metaData;
};

const fileExtract = (fileLink) => {
  // A curation will only have files stored in either mongo or object store (i.e. isStore)
  if (fileLink.includes('isStore=true')) {
    // fileLink already include base
    return fileLink;
  } else {
    const getLinkId = fileLink?.split('=')[1] ?? '';
    return `/api/files/${getLinkId}`;
  }
};

exports.imageTransformer = (imageArray) => {
  const images = [];
  if (imageArray.length) {
    imageArray.map((el) =>
      images.push({
        file: fileExtract(el?.images.File),
        description: el?.images.Description ?? '',
        microscopyType: el?.images.MicroscopyType ?? '',
        type: el?.images.Type ?? '',
        dimension: el?.images.Dimension ?? {},
        metaData: transformMetaData(el?.images.metaData)
      })
    );
  }
  return images;
};

exports.datasetTransformer = datasetTransform;
exports.filesetsTransform = filesetsTransform;
