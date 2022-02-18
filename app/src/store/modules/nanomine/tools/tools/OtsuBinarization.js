import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'Otsu',
      toolLink: '/mm/Otsu',
      linkText: "Use Otsu's Binarization Webtool",
      toolTitle: "Otsu's Method",
      toolText: "Otsu's thresholding method involves iterating through all the possible threshold values and calculating a " +
    'measure of spread for the pixel levels each side of the threshold, i.e. the pixels that either fall in foreground ' +
    '(white) or background (black). The aim is to find the global threshold that minimizes intraclass variance of the ' +
    'thresholded black and white pixels. It works well for relatively noise free images having significant contrast ' +
    'between filler and matrix material.',
      displayTool: true,
      jobTitle: 'Otsu',
      pageTitle: 'Binarization - Otsu Method',
      description: [
        'Upload an image or ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click "Binarize" ' +
    'to binarize image using Otsu\'s Method.'
      ],
      aspectRatio: 'free',
      getImageDimensions: false,
      submit: {
        submitButtonTitle: 'Binarize',
        submitJobTitle: 'otsu',
        submitJobType: 'otsu'
      },
      uploadOptions: [
        {
          title: 'Single image',
          description: 'Supported image formats are .jpg, .tif and .png.'
        },
        {
          title: 'Single image in .mat format',
          description: 'The .mat file must contain ONLY ONE variable named "Input," which contains the image.'
        },
        {
          title: 'ZIP file with multiple images',
          description: 'Submit a ZIP file containing multiple images (supported formats: .jpg, .tif, .png) of same size (in pixels). ' +
      'DO NOT ZIP the folder containing images; select all images and ZIP them directly.'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: true,
      references: [
        {
          authors: 'N. Otsu',
          title: 'A threshold selection method from gray-level histograms',
          venue: 'IEEE transactions on systems, man, and cybernetics, vol. 9, no. 1, pp. 62-66',
          date: '1979'
        }
      ]
    }
  },
  getters
}
