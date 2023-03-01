<template>
  <tool-template :card="card" name="CorrelationCharacterize" :job="job" header="Correlation Function Approach"
    :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="CorrelationCharacterize">
        <md-button class="md-raised md-primary md-raised">
          Use Correlation Function Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Correlation Functions
    </template>
    <template #content>
      They are statistical descriptors that quantitatively connect the macroscopic properties of a heterogeneous image
      to its complex microstructure. Mathematically, they quantify the conditional probability of finding two randomly
      chosen points in the same phase (autocorrelation). Currently, our webtool can evaluate four widely used two-point
      correlation functions - autocorrelation, lineal path, cluster and surface correlation.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Upload a binarized image / ZIP file containing set of images (Supported file formats: .jpg, .tif, .png) and click
      "Characterize". All correlation functions are evaluated for the "white" phase in image.
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
          <strong>ZIP file with multiple images (Coming soon!)</strong> Submit a ZIP file containing multiple images
          (supported formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the folder containing images;
          select all images and ZIP them directly.
        </li>
      </ol>
    </template>
    <template #submit-button>
      Characterize
    </template>
  </tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'CorrelationCharacterize',
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
        '10.1006/jcis.1996.4675',
        '10.1103/PhysRevE.57.495'
      ],
      job: {
        aspectRatio: 'square',
        getImageDimensions: true,
        submitJobTitle: 'CorrelationCharacterize',
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
    }
  }
}
</script>
