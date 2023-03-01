<template>
  <tool-set-template name="ReconstructionTools" :card="card" header="Microstructure Reconstruction">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/Microstructure_Reconstruction.png" alt="Microstructure Reconstruction">
    </template>
    <template #actions>
      <router-link to="reconstruction_homepage">
        <md-button class="md-raised md-primary md-raised">
          See Reconstruction Tools
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Microstructure Reconstruction
    </template>
    <template #content>
      Reconstruction involves constructing a statistically equivalent microstructure image given some statistical
      characterization. In most cases, reconstruction is cast as an optimization problem; with the goal of matching
      characteristics of reconstructed image to that of input image. In this section, you can upload a binary
      microstructure image / set of images and obtain 2D/3D reconstructions using method of your choice.
    </template>
    <!-- tool page-specific slots-->
    <template #cards>
      <correlation-reconstruct card></correlation-reconstruct>
      <descriptor-reconstruct card></descriptor-reconstruct>
      <sdf-reconstruct card></sdf-reconstruct>
      <transfer-learning card></transfer-learning>
    </template>
  </tool-set-template>
</template>

<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import CorrelationReconstruct from '../tools/CorrelationReconstruct.vue'
import DescriptorReconstruct from '../tools/DescriptorReconstruct.vue'
import SDFReconstruct from '../tools/SDFReconstruct.vue'
import TransferLearning from '../tools/TransferLearning.vue'
export default {
  name: 'ReconstructionTools',
  components: {
    ToolSetTemplate,
    CorrelationReconstruct,
    DescriptorReconstruct,
    'sdf-reconstruct': SDFReconstruct,
    TransferLearning
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  }
}
</script>
