<template>
  <tool-set-template name="CharacterizationTools" :card="card" header="Microstructure Characterization">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/Microstructure_Characterization.png" alt="Microstructure Characterization">
    </template>
    <template #actions>
      <router-link to="characterization_homepage">
        <md-button class="md-raised md-primary md-raised">
          See Characterization Tools
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Microstructure Characterization
    </template>
    <template #content>
      Microstructure Characterization refers to a statistical quantification of morphology. It essentially converts
      multi-dimensional microstructure recorded in images into a set of functions (aka features/descriptors/predictors)
      that encode significant morphological details. The functions obtained as a result are useful in developing
      insights on structure - property relationships and serve as the basis for reconstruction algorithms. Upload a
      binarized microstructure image / set of images and obtain characterization data of your choice.
    </template>
    <!-- tool page-specific slots-->
    <template #cards>
      <correlation-characterize card></correlation-characterize>
      <descriptor-characterize card></descriptor-characterize>
      <sdf-characterize card></sdf-characterize>
    </template>
  </tool-set-template>
</template>
<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import CorrelationCharacterize from '../tools/CorrelationCharacterize.vue'
import DescriptorCharacterize from '../tools/DescriptorCharacterize.vue'
import SDFCharacterize from '../tools/SDFCharacterize.vue'

export default {
  name: 'CharacterizationTools',
  components: {
    ToolSetTemplate,
    CorrelationCharacterize,
    DescriptorCharacterize,
    'sdf-characterize': SDFCharacterize
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
