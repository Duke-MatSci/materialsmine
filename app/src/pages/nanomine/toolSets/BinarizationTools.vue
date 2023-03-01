<template>
  <tool-set-template name="BinarizationTools" :card="card" header="Image Binarization">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/Image_Binarization.png" alt="Image Binarization">
    </template>
    <template #actions>
      <router-link to="binarization_homepage">
        <md-button class="md-raised md-primary md-raised">
          See Binarization Tools
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Image Binarization
    </template>
    <template #content>
      Binarization is the process of converting a micrograph to a black & white image (assuming there are only 2 phases) by removing noise and thus simplifying its analysis. All Characterization and Reconstruction algorithms work with binarized images only.
    </template>
    <!-- tool page-specific slots-->
    <template #cards>
      <otsu-binarization tools card></otsu-binarization>
      <niblack-binarization card></niblack-binarization>
    </template>
  </tool-set-template>
</template>
<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import OtsuBinarization from '../tools/OtsuBinarization.vue'
import NiblackBinarization from '../tools/NiblackBinarization.vue'
export default {
  name: 'BinarizationTools',
  components: {
    ToolSetTemplate,
    OtsuBinarization,
    NiblackBinarization
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
