
exports.imageTransformer = (imageArray) => {
  const images = [];
  if (imageArray.length) {
    imageArray.map(el => images.push({
      file: el?.File || '',
      description: el?.Description || '',
      microscopyType: el?.MicroscopyType || '',
      type: el?.Type || '',
      dimension: el?.Dimension || {}
    }));
  }
  return images;
};
