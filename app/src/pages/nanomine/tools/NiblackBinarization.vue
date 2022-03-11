<template>
  <tool-template :card="card" name="Niblack" :job="job" header="Binarization - Niblack method"
    :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="Niblack">
        <md-button class="md-raised md-primary md-raised">
          Use Niblack Binarization Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Niblack's Method
    </template>
    <template #content>
      Niblack's method is an adaptive thresholding algorithm which calculates a pixel-wise threshold by sliding a
      rectangular window over the image. It works well for gray-level images with low contrast between filler and matrix
      material.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Niblack is a local thresholding method for binarization that is particularly useful for images without uniform
      backgrounds and images where calculating a global threshold does not yield good results.
      <br>
      WINDOW SIZE: Niblack involves computing, for each pixel in the grayscale image, the mean and standard deviation of
      the colors of the neighboring pixels in an area (i.e. window size) of predefined size. Window size is generally
      between 1-50, depending on the size of the particles of interest.
      <br>
      K: an image dependent manually selected parameter (generally, the value is -0.2 for dark foreground and +0.2 for
      dark background).
      <br>
      OFFSET: an offset value that is applied when computing the mean and standard deviation for threshold values for
      pixels in an image (to separate foreground and background pixels.) Most of the time, the offset value can be 0.
      <br>
      Upload a grayscale micrograph image in .jpg/.png/.tif format and click "Binarize" to perform dynamic Niblack
      binarization. A default window size of 5 pixels (i.e. 5 x 5 pixel window) will be used.
      <br>
      After binarization is complete, this page will be updated to show the results. You can change window size and
      retry binarization until you get satisfactory result.
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
  name: 'NiblackBinarization',
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
        submitJobTitle: 'otsu',
        submitJobType: 'niblack',
        aspectRatio: 'free',
        getImageDimensions: false,
        acceptableFileTypes: '.jpg, .png, .tif, .mat',
        useWebsocket: true,
        selects: [
          {
            title: 'Window Size (usually between 1 and 50)',
            submitJobTitle: 'WindowSize'
          },
          {
            title: 'K (Optional, usually between -0.2 and +0.2)',
            submitJobTitle: 'KNiblack'
          },
          {
            title: 'Offset (Optional, usually set to 0)',
            submitJobTitle: 'OffsetNiblack'
          }
        ]
      },
      references: [
        '978-0134806747',
        '10.1117/12.805827'
      ]
    }
  }
}
</script>
