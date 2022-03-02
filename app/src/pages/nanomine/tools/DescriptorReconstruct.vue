<template>
  <tool-template :tool="tool" :card="card"></tool-template>
</template>

<script>
import ToolTemplate from './ToolTemplate'

export default {
  name: 'DescriptorReconstruct',
  components: {
    ToolTemplate
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
        name: 'DescriptorReconstruct',
        link: 'DescriptorReconstruct',
        linkText: 'Use Physical Descriptor Webtool',
        title: 'Physical Descriptors',
        text: 'This webtool creates a 3D reconstruction from the 2D input image. It follows a four step hierarchical reconstruction ' +
      'methodology to match descriptors - Volume fraction, nearest neighbor distance, equivalent radius and aspect ratio of white ' +
      'phase in 3D reconstruction to those in input microstructure. Please refer to articles by Xu et.al. (see references) for more ' +
      'details. This technique is best suited for isotropic microstructures with spherical/ellipsoidal filler aggregates. Time ' +
      'required for reconstruction depends on number of filler aggregates contained in input image.',
        display: true,
        jobTitle: 'Descriptor Reconstruction',
        pageTitle: 'Physical Descriptors',
        description: [
          'Upload a binarized image in JPEG/PNG/TIF format to generate a statistically equivalent 3D reconstruction.',
          'The webtool first evaluates all necessary descriptors for the input image. Assuming filler aggregates to be ellipsoidal and ' +
        'isotropic microstructure, the descriptors obtained from input image are used to estimate the values of corresponding descriptors ' +
        'for 3D reconstruction. The reconstruction procedure follows a four-step hierarchical methodology outlined in articles by Xu et.al. ' +
        '(see references). The 3D reconstruction has the same resolution as the input image; i.e. the edge length of a voxel in 3D ' +
        'reconstruction has the same physical size as that of a pixel in the 2D input image.'
        ],
        aspectRatio: 'free',
        getImageDimensions: true,
        submit: {
          submitButtonTitle: 'Reconstruct',
          submitJobTitle: 'DescriptorReconstruct'
        },
        uploadOptions: [
          {
            title: 'Note',
            description: 'Images must be binarized.'
          },
          {
            title: 'Single image',
            description: 'Supported file formats are JPEG, PNG and TIF.'
          },
          {
            title: 'Single image in .mat format',
            description: 'The .mat file must contain ONLY ONE variable named "Input" - which contains pixel values (only 0 or 1).'
          },
          {
            title: 'ZIP file with multiple images (Coming soon!)',
            description: 'Submit a ZIP file containing multiple JPEG images of same size (in pixels). DO NOT ZIP the folder containing images; ' +
          'select all images and ZIP them directly. The mean value of each descriptor (averaged over all images) will be used for reconstruction.'
          }
        ],
        acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
        useWebsocket: false,
        results: [
          'The results will include 3D reconstructed image (Input_3D_recon.mat), a list of coordinates of cluster (white phase) centroids in ' +
        '"Input_3D_recon_center_list.mat", the input image and a random 2D cross-section (Slice.jpg) from the 3D reconstructed image. Additionally, ' +
        'a plot (Autocorrelation_comparison.jpg) comparing the autocorrelation of input image with 10 randomly chosen 2D slices from reconstruction ' +
        'is provided to validate the accuracy of reconstruction.'
        ],
        references: [
          '10.1115/1.4026649',
          '10.1016/j.commatsci.2013.12.046'
        ]
      }
    }
  }
}
</script>
