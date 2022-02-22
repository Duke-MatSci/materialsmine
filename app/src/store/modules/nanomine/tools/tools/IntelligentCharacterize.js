import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'IntelligentCharacterize',
      toolLink: 'IntelligentCharacterize',
      toolImageFile: 'nanomine/Intelligent_Characterization.png',
      toolTitle: 'Correlation Functions',
      toolText: 'The intelligent characterization tool selects the most suitable characterization method between the “physical descriptors” ' +
      'and the “spectral density function (SDF)” approaches based on analyzing the user uploaded image(s). Results generated can be easily ' +
      'passed to the NanoMine Database.',
      displayTool: true,
      jobTitle: 'Intelligent Characterization',
      pageTitle: 'Intelligent Characterization',
      description: [
        'This tool assesses the uploaded image(s) of microstructure and performs analysis to decide which characterization method suits the ' +
          'best. The process consists of three steps:',
        '(1) Calculate universal descriptors, i.e., void fraction, isotropy index, and interfacial area.',
        '(2) Determine whether Spheroidal Descriptors or Spectral Density Function (SDF) is more applicable, based on isotropy index and ' +
          'connectivity index. If the material is not isotropic or too connected, then the Spheroidal Descriptors are not applicable.',
        '(3) Generate results for either Spheroidal Descriptors or SDF representation. If Spheroidal Descriptor method is chosen, results ' +
          'of Nearest Neighbor Distance, Number of clusters, Compactness, Cluster Area, Cluster Radius, Elongation Ratio, Orientation Angle, and ' +
          'Rectangularity will be provided. If the SDF method is chosen, the following five different forms of SDF will be tested and the best ' +
          'fitted form will be chosen with output of the fitted parameters and the goodness of fit value.',
        'Chi-square fit: <math>y = a * f<sub>k</sub>(b * x, n)</math>, where <math>f<sub>k</sub></math> is the probability density function of ' +
          'chi-square distribution.',
        'Gamma fit: <math>y = a * f<sub>g</sub>(x - x<sub>0</sub>, b, c)</math>, where <math>f<sub>g</sub></math> is the probability density ' +
          'function of gamma distribution.',
        'Gaussian fit: <math>y = a * exp[-b * (x - x<sub>0</sub>)<sup>2</sup>]</math>',
        'Step function fit: <math>y = a * [h(x-x<sub>1</sub>) - h(x-x<sub>2</sub>)]</math>, where <math>h</math> is Heaviside function.',
        'Exponential fit: <math>y = a * exp[-b * (x - x<sub>0</sub>)]</math>',
        'Double peak fit: <math>y = a<sub>1</sub> * exp[-b<sub>1</sub> * (x - x<sub>1</sub>)<sup>2</sup>] +  a<sub>2</sub> * exp[-b<sub>2</sub> ' +
          '* (x - x<sub>2</sub>)<sup>2</sup>]</math>'
      ],
      aspectRatio: 'free',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Characterize',
        submitJobTitle: 'IntelligentCharacterize'
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
          description: 'Submit a ZIP file containing multiple images (supported formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the ' +
          'folder containing images; select all images and ZIP them directly.'
        }
      ],
      acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
      useWebsocket: false,
      references: [
        {
          authors: 'Bostanabad, R., Zhang, Y., Li, X., Kearney, T., Brinson, L. C., Apley, D., Wing K., and Chen, W.',
          title: 'Computational Microstructure Characterization and Reconstruction: Review of the State-of-the-art Techniques',
          venue: 'Progress in Materials Science 95',
          date: 'June 2018'
        }
      ]
    }
  },
  getters
}
