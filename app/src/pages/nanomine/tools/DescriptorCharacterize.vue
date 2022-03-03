<template>
  <tool-template :tool="tool" :card="card"></tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'DescriptorCharacterize',
  components: {
    ToolTemplate: MCRToolTemplate
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: function () {
    return {
      tool: {
        name: 'DescriptorCharacterize',
        link: 'DescriptorCharacterize',
        linkText: 'Use Physical Descriptor Webtool',
        title: 'Physical Descriptors',
        text: 'Physical descriptors (aka features/predictors) provide a meaningful and convenient approach for direct elucidation ' +
    'of Processing-Structure-Property relations. Descriptors are important structural parameters that are highly related to ' +
    'material properties and provide a reduced dimension representation of microstructure. Extracting descriptors from a microstructure' +
    'image involves application of image segmentation techniques to identify clusters of filler material followed by analysis of ' +
    'individual cluster. Although one can consider several descriptors, our webtool evaluates four descriptors - volume fraction, ' +
    'number of white phase aggregates, aspect ratio and nearest neighbor distance. This method is best suited for materials with ' +
    'particulate filler clusters that are spherical/ellipsoidal in shape.',
        display: true,
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
          '10.1115/1.4026649',
          '10.1016/j.commatsci.2013.12.046'
        ]
      }
    }
  }
}
</script>
