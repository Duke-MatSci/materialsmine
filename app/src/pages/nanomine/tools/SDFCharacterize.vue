<template>
  <tool-template :card="card" name="SDFCharacterize" :job="job" header="Spectral Density Function"
    :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="SDFCharacterize">
        <md-button class="md-raised md-primary md-raised">
          Use Spectral Density Function Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Spectral Density Function
    </template>
    <template #content>
      The Spectral Density Function (SDF) is a frequency domain microstructure representation where different
      frequencies represent real space features at different length scales. SDF provides a low-dimensional
      microstructure representation for quasi-random materials which have arbitrary filler geometry but its distribution
      is governed by an underlying spatial correlation. The inverse Fourier Transform of SDF is the two-point
      autocorrelation function.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Upload a binarized image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click
      "Characterize". All correlation functions are evaluated for the "white" phase in image.
    </template>
    <template #input-options>
      <ol>
        <li>
          <strong>Single image:</strong> Supported image formats are .jpg, .tif and .png. The results will include the
          2D SDF and its radially averaged 1D version in CSV file format.
        </li>
        <li>
          <strong>Single image in .mat format:</strong> The .mat file must contain ONLY ONE variable named "Input,"
          which contains the image. The results will include the 2D SDF and its radially averaged 1D version in CSV file
          format.
        </li>
        <li>
          <strong>ZIP file with multiple images:</strong> Submit a ZIP file containing multiple images (supported
          formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the folder containing images; select all
          images and ZIP them directly. DO NOT ZIP the folder containing images; select all images and ZIP them
          directly. The results will include a folder "input" which contains all images submitted by user, one folder
          for each input image that comprises the 2D and 1D SDF (in CSV format) of the respective image. Additionally,
          the mean 2D and 1D SDF, averaged over all input images is provided in CSV file along with a plot of the mean
          2D SDF in "SDF_2D.jpg".
        </li>
      </ol>
    </template>
    <template #submit-button>
      <md-button class="md-layout-item md-size-100 md-primary md-raised">
        Characterize
      </md-button>
    </template>
  </tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'SDFCharacterize',
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
      job: {
        aspectRatio: 'square',
        getImageDimensions: true,
        submitJobTitle: 'SDFCharacterize',
        acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
        useWebsocket: false
      },
      references: [
        '10.1115/DETC201886154',
        '10.1115/1.4036582',
        '10.1073/pnas.1704711114'
      ]
    }
  }
}
</script>
