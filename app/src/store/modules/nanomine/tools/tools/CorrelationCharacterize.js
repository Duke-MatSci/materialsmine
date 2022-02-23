import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'CorrelationCharacterize',
      toolLink: 'CorrelationCharacterize',
      linkText: 'Use Correlation Function Webtool',
      toolTitle: 'Correlation Functions',
      toolText: 'They are statistical descriptors that quantitatively connect the macroscopic properties of a heterogeneous image ' +
    'to its complex microstructure. Mathematically, they quantify the conditional probability of finding two randomly chosen ' +
    'points in the same phase (autocorrelation). Currently, our webtool can evaluate four widely used two-point correlation ' +
    'functions - autocorrelation, lineal path, cluster and surface correlation.',
      displayTool: true,
      references: [
        '10.1006/jcis.1996.4675',
        '10.1103/PhysRevE.57.495'
      ],
      jobTitle: 'Correlation Characterize',
      pageTitle: 'Correlation Function Approach',
      description: [
        'Upload a binarized image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click "Characterize". ' +
    'All correlation functions are evaluated for the "white" phase in image.'
      ],
      aspectRatio: 'square',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Characterize',
        submitJobTitle: 'CorrelationCharacterize'
      },
      uploadOptions: [
        {
          title: 'Single image',
          description: 'Supported image formats are .jpg, .tif and .png.'
        },
        {
          title: 'Single image in .mat format',
          description: 'The .mat file must contain ONLY ONE variable named "Input" - which contains the image.'
        },
        {
          title: 'ZIP file with multiple images (Coming soon!)',
          description: 'Submit a ZIP file containing multiple images (supported formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ' +
        'ZIP the folder containing images; select all images and ZIP them directly.'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: false,
      selects: [
        {
          title: 'Correlation Name',
          submitJobTitle: 'CorrelationType',
          options: ['Autocorrelation', 'Lineal Path Correlation', 'Cluster Correlation', 'Surface Correlation']
        }
      ]
    }
  },
  getters
}
