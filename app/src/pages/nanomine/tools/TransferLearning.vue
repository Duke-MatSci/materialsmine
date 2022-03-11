<template>
  <tool-template card name="TransferLearning" :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <a href="https://ideal.mech.northwestern.edu/research/software/download/" target="_blank">
        <md-button class="md-raised md-primary md-raised">
          Request Download
        </md-button>
      </a>
    </template>
    <template #title>
      Transfer Learning
    </template>
    <template #content>
      Transfer learning captures spatial correlations for microstructure reconstruction by leveraging the superior
      capabilities of deep convolution networks. It incorporates an encoder-decoder process process and feature-match
      optimization algorithm using the pre-trained VGG19 model. It can handle complex microstructures, and has the
      potential of expediting the discovery of new materials. Please refer to the article by
      <a href="https://doi.org/10.1038/s41598-018-31571-7" target="_blank">Li et. al.</a> for more details. The code
      package may be requested for research purposes by clicking on the link below. You will asked to fill in a form and
      we will email you following the form completion.
    </template>
  </tool-template>
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
      references: [
        '10.1038/s41598-018-31571-7'
      ]
    }
  }
}
</script>
