const { datasetTransform, filesetsTransform } = require('./datasets');

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

exports.pixelDataTransformer = (unitcell) => {
  if (unitcell === 'TEN') {
    return [{
      symmetry: 'C4v',
      unit_cell_x_pixels: '10',
      unit_cell_y_pixels: '10',
      geometry_condensed: '000000000001001',
      geometry_full: '1010000101000000000010000000010000000000000000000000000000000000000000100000000100000000001010000101',
      condition: 'Plane Strain',
      C11: '2963290579',
      C12: '1459531181',
      C22: '2963290579'
    }];
  } else {
    return [{
      symmetry: 'C2v',
      unit_cell_x_pixels: '50',
      unit_cell_y_pixels: '50',
      geometry_condensed: '',
      geometry_full: '0000000000001111100000000000000001111100000000000000000000000011111000000000000000011111000000000000000000000000111110000000000000000111110000000000000000000000001111100000000000000001111100000000000000000000001',
      condition: 'Plane Strain',
      C11: '567844532.27',
      C12: '86951532.93',
      C22: '683684174.39'
    }];
  };
};

exports.datasetTransformer = datasetTransform;
exports.filesetsTransform = filesetsTransform;
