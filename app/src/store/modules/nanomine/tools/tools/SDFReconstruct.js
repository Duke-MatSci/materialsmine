import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'SDFReconstruct',
      toolLink: 'SDFReconstruct',
      linkText: 'Use Spectral Density Function Webtool',
      toolTitle: 'Spectral Density Function',
      toolText: 'The reconstruction method involves level-cutting a Gaussian Random Field which has the same spectral density function ' +
            '(SDF) as the input image. The level-cut parameter is defined by the volume fraction of white phase. Please refer to article by ' +
            'Yu et.al.(see references) for more details. This method is best suited for porous, isotropic, stationary microstructure.',
      displayTool: true,
      jobTitle: 'Spectral Density Reconstruction',
      pageTitle: 'Spectral Density Function',
      description: [
        'Upload a image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click "Reconstruct". Reconstructions ' +
        'are generated by level-cutting a Gaussian Random Field (see references)'
      ],
      aspectRatio: 'square',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Reconstruct',
        submitJobTitle: 'SDFReconstruct'
      },
      uploadOptions: [
        {
          title: 'Note',
          description: 'Images must be binarized.'
        },
        {
          title: 'Single image',
          description: 'Supported image formats are .jpg, .tif and .png. The reconstruction results will include the input and reconstructed ' +
          'images in JPG format, the 2D SDF (data in Input_SDF_2D.csv, plotted in SDF_2D.jpg) and it\'s radial average (Input_SDF_1D.csv). ' +
          'The reconstructed images will be provided in JPEG format along with a plot comparing their autocorrelation function with the ' +
          'autocorrelation of input image.'
        },
        {
          title: 'Single image in .mat format',
          description: 'The .mat file must contain ONLY ONE variable named "Input" - which contains pixel values (only 0 or 1). The ' +
          'reconstruction results will include the input and reconstructed images in JPG format, the 2D SDF (data in Input_SDF_2D.csv, ' +
          'plotted in SDF_2D.jpg) and its radial average (Input_SDF_1D.csv). The reconstructed images will be provided in JPEG format ' +
          'along with a plot comparing their autocorrelation function with the mean autocorrelation of input images.'
        },
        {
          title: 'ZIP file with multiple images',
          description: 'Submit a ZIP file containing multiple images of same size (in pixels). DO NOT ZIP the folder containing images; ' +
          'select all images and ZIP them directly. The mean SDF (averaged over all input images) will be used for reconstruction. The results ' +
          'include 2D and 1D SDF for all input images provided in folders named "Input1", "Input2" etc. The mean SDF of input images are provided ' +
          'in CSV files "SDF_1D_mean.csv" and "SDF_2D_mean.csv" and the 2D mean plotted in "SDF_2D.jpg". The reconstructed images will be ' +
          'provided in JPEG format along with a plot comparing their autocorrelation function with the mean autocorrelation of input images.'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: false,
      references: [
        '10.1115/DETC201886154',
        '10.1115/1.4036582',
        '10.1073/pnas.1704711114'
      ],

      selects: [
        {
          title: 'Number of Reconstructions',
          submitJobTitle: 'NumOfReconstructs',
          options: ['1', '2', '3', '4', '5']
        }
      ]
    }
  },
  getters
}
