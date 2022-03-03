<template>
  <tool-template :tool="tool" :card="card"></tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'TransferLearning',
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
        name: 'TransferLearning',
        link: 'https://ideal.mech.northwestern.edu/research/software/download/',
        externalToolLink: true,
        linkText: 'Request Download',
        title: 'Transfer Learning',
        text: 'Transfer learning captures spatial correlations for microstructure reconstruction by leveraging the superior capabilities ' +
      'of deep convolution networks. It incorporates an encoder-decoder process process and feature-match optimization algorithm using ' +
      'the pre-trained VGG19 model. It can handle complex microstructures, and has the potential of expediting the discovery of new ' +
      'materials. Please refer to the article by Li et. al. (see references) for more details. The code package may be requested for ' +
      'research purposes by clicking on the link below. You will asked to fill in a form and we will email you following the form completion.',
        display: true,
        references: [
          '10.1038/s41598-018-31571-7'
        ]
      }
    }
  }
}
</script>
