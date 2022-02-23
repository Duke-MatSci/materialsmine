import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'CorrelationReconstruct',
      toolLink: 'CorrelationReconstruct',
      linkText: 'Use Correlation Function Webtool',
      toolTitle: 'Correlation Functions',
      toolText: 'Reconstruction using correlation functions employs the Yeong-Torquato method which involves Simulated Annealing based ' +
      'random pixel swapping to match the correlation function of 2D reconstructed image to that of 2D input image. The choice of ' +
      'correlation function to be matched and the number of reconstructed images can be chosen by user. This method is well-suited ' +
      'for porous, isotropic materials. The reconstruction time depends on choice of correlation function chosen and volume (area) ' +
      'fraction of white phase.',
      displayTool: true,
      references: [
        '10.1006/jcis.1996.4675',
        '10.1103/PhysRevE.57.495'
      ],
      jobTitle: 'Correlation Reconstruction',
      pageTitle: 'Correlation Function Approach',
      description: [
        'Upload a binarized image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click "Reconstruct" ' +
        'to reconstruct statistically equivalent image. All correlation functions are evaluated for the "white" phase in image.'
      ],
      aspectRatio: 'square',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Reconstruct',
        submitJobTitle: 'CorrelationReconstruct'
      },
      uploadOptions: [
        {
          title: 'Note',
          description: 'Images must be binarized.'
        },
        {
          title: 'Single image',
          description: 'Supported image formats are .jpg, .tif and .png. The reconstruction results will include the input and ' +
          'reconstructed images in JPG format, the 2D SDF (data in Input_SDF_2D.csv, plotted in SDF_2D.jpg) and it\'s radial average ' +
          '(Input_SDF_1D.csv). The reconstructed images will be provided in JPEG format along with a plot comparing their autocorrelation ' +
          'function with the autocorrelation of input image.'
        },
        {
          title: 'Single image in .mat format',
          description: 'The .mat file must contain ONLY ONE variable named "Input" - which contains pixel values (only 0 or 1). The ' +
          'reconstruction results will include the input and reconstructed images in JPG format, the 2D SDF (data in Input_SDF_2D.csv, ' +
          'plotted in SDF_2D.jpg) and it\'s radial average (Input_SDF_1D.csv). The reconstructed images will be provided in JPEG format ' +
          'along with a plot comparing their autocorrelation function with the mean autocorrelation of input images.'
        },
        {
          title: 'ZIP file with multiple images',
          description: 'Submit a ZIP file containing multiple images of same size (in pixels). DO NOT ZIP the folder containing images; ' +
          'select all images and ZIP them directly. The mean value of chosen correlation (averaged over all input images) will be used for ' +
          'reconstruction. The results include 2D and 1D SDF for all input images provided in folders named "Input1", "Input2" etc. The ' +
          'mean SDF of input images are provided in CSV files "SDF_1D_mean.csv" and "SDF_2D_mean.csv" and the 2D mean plotted in "SDF_2D.jpg". ' +
          'The reconstructed images will be provided in JPEG format along with a plot comparing their autocorrelation function with the ' +
          'mean autocorrelation of input images.'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: false,
      selects: [
        {
          title: 'Correlation Name',
          submitJobTitle: 'CorrelationType',
          options: ['Autocorrelation', 'Lineal Path Correlation', 'Cluster Correlation', 'Surface Correlation']
        },
        {
          title: 'Number of Reconstructions',
          submitJobTitle: 'NumOfReconstructs',
          options: ['1', '2']
        }
      ]
    }
  },
  getters
}
