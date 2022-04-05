<template>
  <tool-set-template name="MCRTools" :card="card" header="Microstructure Characterization and Reconstruction">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/recon_tool.png" alt="Microstructure Characterization and Reconstruction Tools">
    </template>
    <template #actions>
      <router-link to="mcr_homepage">
        <md-button class="md-raised md-primary md-raised">
          Launch
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Microstructure Characterization and Reconstruction
    </template>
    <template #content>
      An essential component of computational material design involves microstructure analysis. Our user friendly
      webtools allow users to characterize microstructure images and reconstruct statistically equivalent
      microstructures. Users can choose among multiple input formats as well as characterization and reconstruction
      methods. Available characterization and reconstruction methods include: Correlation Functions (Two-point, Lineal
      Path, Cluster, and Surface), Spectral Density Function (SDF), and Descriptors.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Microstructure Characterization and Reconstruction (MCR) is an essential component of computational material
      design as it helps in understanding structure - property relationships. This page allows you to characterize and
      reconstruct images of polymer nanocomposites. All webtools accept inputs in multiple formats and allow download of
      results. Please click on the appropriate button.
    </template>
    <template #cards>
      <binarization-tools card></binarization-tools>
      <characterization-tools card></characterization-tools>
      <reconstruction-tools card></reconstruction-tools>
      <intelligent-characterize card></intelligent-characterize>
    </template>
  </tool-set-template>
</template>
<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import BinarizationTools from './BinarizationTools.vue'
import CharacterizationTools from './CharacterizationTools.vue'
import ReconstructionTools from './ReconstructionTools.vue'
import IntelligentCharacterize from '../tools/IntelligentCharacterize.vue'

export default {
  name: 'MCRTools',
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  components: {
    ToolSetTemplate,
    BinarizationTools,
    CharacterizationTools,
    ReconstructionTools,
    IntelligentCharacterize
  }
}
</script>
