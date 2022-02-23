import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'DescriptorCharacterize',
      toolLink: 'DescriptorCharacterize',
      linkText: 'Use Physical Descriptor Webtool',
      toolTitle: 'Physical Descriptors',
      toolText: 'Physical descriptors (aka features/predictors) provide a meaningful and convenient approach for direct elucidation ' +
    'of Processing-Structure-Property relations. Descriptors are important structural parameters that are highly related to ' +
    'material properties and provide a reduced dimension representation of microstructure. Extracting descriptors from a microstructure' +
    'image involves application of image segmentation techniques to identify clusters of filler material followed by analysis of ' +
    'individual cluster. Although one can consider several descriptors, our webtool evaluates four descriptors - volume fraction, ' +
    'number of white phase aggregates, aspect ratio and nearest neighbor distance. This method is best suited for materials with ' +
    'particulate filler clusters that are spherical/ellipsoidal in shape.',
      displayTool: true,
      jobTitle: 'Descriptor Characterization',
      pageTitle: 'Physical Descriptors',
      description: [
        'Upload a binarized image or a ZIP file containing set of images and click "Characterize" to get descriptors for filler material. ' +
    'The descriptors evaluated by this webtool are - filler volume fraction (equivalent to area fraction), number of filler clusters and ' +
    'area, aspect ratio & nearest neighbor distance of each filler cluster. Nearest neighbor distance of a cluster is the distance between ' +
    'its centroid and that of a cluster nearest to it. Except for volume fraction, number of clusters and aspect ratio (which are ' +
    'dimensionless), all descriptors have units of "pixels" ("pixel^2" for area descriptor).'
      ],
      aspectRatio: 'free',
      getImageDimensions: true,
      submit: {
        submitButtonTitle: 'Characterize',
        submitJobTitle: 'DescriptorCharacterize'
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
      useWebsocket: false,
      references: [
        {
          authors: 'Xu, H., Li, Y., Brinson, C. and Chen, W.',
          title: 'A descriptor-based design methodology for developing heterogeneous microstructural materials system',
          venue: 'Journal of Mechanical Design, 136(5), p.051007',
          date: '2014'
        },
        {
          authors: 'Xu, H., Dikin, D.A., Burkhart, C. and Chen, W.',
          title: 'Descriptor-based methodology for statistical characterization and 3D reconstruction of microstructural materials',
          venue: 'Computational Materials Science, 85, pp.206-216',
          date: '2014'
        }
      ]
    }
  },
  getters
}
