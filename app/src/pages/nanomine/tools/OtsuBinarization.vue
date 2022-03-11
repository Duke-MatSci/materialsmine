<template>
  <tool-template :card="card" name="Otsu" :job="job" header="Binarization - Otsu method" :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="Otsu">
        <md-button class="md-raised md-primary md-raised">
          Use Otsu's Binarization Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Otsu's Method
    </template>
    <template #content>
      Otsu's thresholding method involves iterating through all the possible threshold values and calculating a measure
      of spread for the pixel levels each side of the threshold, i.e. the pixels that either fall in foreground (white)
      or background (black). The aim is to find the global threshold that minimizes intraclass variance of the
      thresholded black and white pixels. It works well for relatively noise free images having significant contrast
      between filler and matrix material.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Upload an image or ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click
      "Binarize" to binarize image using Otsu's Method.
    </template>
    <template #input-options>
      <ol>
        <li>
          <strong>Single image:</strong> Supported image formats are .jpg, .tif and .png.
        </li>
        <li>
          <strong>Single image in .mat format:</strong> The .mat file must contain ONLY ONE variable named "Input,"
          which contains the image.
        </li>
        <li>
          <strong>ZIP file with multiple images:</strong> Submit a ZIP file containing multiple images (supported
          formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the folder containing images; select all
          images and ZIP them directly.
        </li>
      </ol>
    </template>
    <template #submit-button>
      <md-button class="md-layout-item md-size-100 md-primary md-raised">
        Binarize
      </md-button>
    </template>
  </tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'OtsuBinarization',
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
      references: [
        '10.1109/TSMC.1979.4310076'
      ],
      job: {
        aspectRatio: 'free',
        getImageDimensions: false,
        submitJobTitle: 'otsu',
        submitJobType: 'otsu',
        acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
        useWebsocket: true
      }
    }
  }
}
</script>
