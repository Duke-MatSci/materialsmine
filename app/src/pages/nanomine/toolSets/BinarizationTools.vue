<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
export default {
  name: 'BinarizationTools',
  components: {
    ToolSetTemplate: () => import('./ToolSetTemplate.vue')
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
      pageContent: {
        title: 'Image Binarization',
        name: 'BinarizationTools',
        description: 'Binarization is the process of converting a micrograph to a black & white image' +
        '(assuming there are only 2 phases) by removing noise and thus simplifying its analysis.' +
        'All Characterization and Reconstruction algorithms work with binarized images only.',
        imageFile: 'nanomine/Image_Binarization.png',
        link: 'binarization_homepage',
        display: true,
        text: 'Choose the Binarization method from the options below.',
        tools: [
          'OtsuBinarization',
          'NiblackBinarization'
        ]
      }
    }
  }
}
</script>
