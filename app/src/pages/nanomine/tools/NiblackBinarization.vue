<template>
  <tool-template :tool="tool" :card="card"></tool-template>
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
      tool: {
        name: 'Niblack',
        link: 'Niblack',
        linkText: 'Use Niblack Binarization Webtool',
        title: "Niblack's Method",
        text: "Niblack's method is an adaptive thresholding algorithm which calculates a pixel-wise threshold by sliding " +
    'a rectangular window over the image. It works well for gray-level images with low contrast between filler and matrix material.',
        display: true,
        jobTitle: 'Niblack',
        pageTitle: 'Binarization - Niblack Method',
        description: [
          'Niblack is a local thresholding method for binarization that is particularly useful for images without uniform backgrounds and ' +
      'images where calculating a global threshold does not yield good results.',
          'WINDOW SIZE: Niblack involves computing, for each pixel in the grayscale image, the mean and standard deviation of the colors of ' +
      'the neighboring pixels in an area (i.e. window size) of predefined size. Window size is generally between 1-50, depending on the ' +
      'size of the particles of interest.',
          'K: an image dependent manually selected parameter (generally, the value is -0.2 for dark foreground and +0.2 for dark background).',
          'OFFSET: an offset value that is applied when computing the mean and standard deviation for threshold values for pixels in an image ' +
      '(to separate foreground and background pixels.) Most of the time, the offset value can be 0.',
          'Upload a grayscale micrograph image in .jpg/.png/.tif format and click "Binarize" to perform dynamic Niblack binarization. A default ' +
      'window size of 5 pixels (i.e. 5 x 5 pixel window) will be used.',
          'After binarization is complete, this page will be updated to show the results. You can change window size and retry binarization ' +
      'until you get satisfactory result.'
        ],
        aspectRatio: 'free',
        getImageDimensions: false,
        submit: {
          submitButtonTitle: 'Binarize',
          submitJobTitle: 'otsu',
          submitJobType: 'niblack'
        },
        uploadOptions: [
          {
            title: 'Single image',
            description: 'Supported image formats are .jpg, .tif and .png.'
          },
          {
            title: 'Single image in .mat format',
            description: 'The .mat file must contain ONLY ONE variable named "Input," which contains the image.'
          }
        ],
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
        ],
        references: [
          '978-0134806747',
          '10.1117/12.805827'
        ]
      }
    }
  }
}
</script>
