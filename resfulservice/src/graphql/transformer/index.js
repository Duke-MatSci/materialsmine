
exports.imageTransformer = (imageArray) => {
  const getBase = `${process.env?.ROUTER}/api/files/`;
  const images = [];
  if (imageArray.length) {
    imageArray.map(el => images.push({
      file: getBase + el?.File?.split('=')[1] || '',
      description: el?.Description || '',
      microscopyType: el?.MicroscopyType || '',
      type: el?.Type || '',
      dimension: el?.Dimension || {},
      metaData: el?.metaData || {}
    }));
  }
  return images;
};
