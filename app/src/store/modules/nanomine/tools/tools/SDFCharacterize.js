import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'SDFCharacterize',
      toolLink: 'SDFCharacterize',
      linkText: 'Use Spectral Density Function Webtool',
      toolTitle: 'Spectral Density Function',
      toolText: 'The Spectral Density Function (SDF) is a frequency domain microstructure representation where different frequencies ' +
    'represent real space features at different length scales. SDF provides a low-dimensional microstructure representation for ' +
    'quasi-random materials which have arbitrary filler geometry but its distribution is governed by an underlying spatial ' +
    'correlation. The inverse Fourier Transform of SDF is the two-point autocorrelation function.',
      displayTool: true,
      jobTitle: 'SDF Characterization',
      pageTitle: 'Spectral Density Function',
      description: [
        'Upload a binarized image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click "Characterize". ' +
      'All correlation functions are evaluated for the "white" phase in image.'
      ],
      aspectRatio: 'square',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Characterize',
        submitJobTitle: 'SDFCharacterize'
      },
      uploadOptions: [
        {
          title: 'Single image',
          description: 'Supported image formats are .jpg, .tif and .png.The results will include the 2D SDF and it\'s radially averaged ' +
        '1D version in CSV file format.'
        },
        {
          title: 'Single image in .mat format',
          description: 'The .mat file must contain ONLY ONE variable named "Input" - which contains the image.The results will include ' +
        'the 2D SDF and it\'s radially averaged 1D version in CSV file format.'
        },
        {
          title: 'ZIP file with multiple images',
          description: 'Submit a ZIP file containing multiple images (supported formats: .jpg, .tif, .png) of same size (in pixels). ' +
        'DO NOT ZIP the folder containing images; select all images and ZIP them directly. DO NOT ZIP the folder containing images; ' +
        'select all images and ZIP them directly. The results will include a folder "input" which contains all images submitted by ' +
        'user, one folder for each input image that comprises the 2D and 1D SDF (in CSV format) of the respective image. Additionally, ' +
        'the mean 2D and 1D SDF, averaged over all input images is provided in CSV file along with a plot of the mean 2D SDF in "SDF_2D.jpg".'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: false,
      references: [
        '10.1115/DETC201886154',
        '10.1115/1.4036582',
        '10.1073/pnas.1704711114'
      ]
    }
  },
  getters
}
