
const transformMetaData = (el) => {
  const metaData = el || {};
  metaData.keywords = typeof el?.keywords === 'object'
    ? el.keywords
    : typeof el?.keywords === 'string'
      ? el.keywords.split(',')
      : [];

  return metaData;
};

exports.imageTransformer = (imageArray) => {
  const getBase = '/api/files/';
  const images = [];
  if (imageArray.length) {
    imageArray.map(el => images.push({
      file: getBase + el?.File?.split('=')[1] || '',
      description: el?.Description || '',
      microscopyType: el?.MicroscopyType || '',
      type: el?.Type || '',
      dimension: el?.Dimension || {},
      metaData: transformMetaData(el?.metaData)
    }));
  }
  return images;
};
