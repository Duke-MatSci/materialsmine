<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
export default {
  name: 'CharacterizationTools',
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
        title: 'Microstructure Characterization',
        name: 'CharacterizationTools',
        description: 'Microstructure Characterization refers to a statistical quantification of morphology.' +
        'It essentially converts multi-dimensional microstructure recorded in images' +
        'into a set of functions (aka features/descriptors/predictors) that encode significant morphological details.' +
        'The functions obtained as a result are useful in developing insights on structure - property relationships' +
        'and serve as the basis for reconstruction algorithms.' +
        'Upload a binarized microstructure image / set of images and obtain characterization data of your choice.',
        imageFile: 'nanomine/Microstructure_Characterization.png',
        link: 'characterization_homepage',
        display: true,
        text: 'Choose the characterization method from the options below. Note that uploaded images will be binarized using Otsu method',
        tools: [
          'CorrelationCharacterize',
          'DescriptorCharacterize',
          'SDFCharacterize'
        ]
      }
    }
  }
}
</script>
