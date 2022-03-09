<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
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
    ToolSetTemplate: () => import('./ToolSetTemplate.vue')
  },
  data: function () {
    return {
      pageContent: {
        name: 'MCRTools',
        title: 'Microstructure Characterization and Reconstruction',
        description: 'An essential component of computational material design involves microstructure analysis. Our user friendly ' +
      'webtools allow users to characterize microstructure images and reconstruct statistically equivalent microstructures. Users can choose ' +
      'among multiple input formats as well as characterization and reconstruction methods. Available characterization and reconstruction ' +
      'methods include: Correlation Functions (Two-point, Lineal Path, Cluster, and Surface), Spectral Density Function (SDF), and Descriptors.',
        text: 'Microstructure Characterization and Reconstruction (MCR) is an essential component of computational material ' +
      'design as it helps in understanding structure - property relationships. This page allows you to characterize and reconstruct images ' +
      'of polymer nanocomposites. All webtools accept inputs in multiple formats and allow download of results. Please click on the ' +
      'appropriate button.',
        imageFile: 'nanomine/recon_tool.png',
        link: 'mcr_homepage',
        display: true,
        tools: [
          'IntelligentCharacterize'
        ],
        toolSets: [
          'BinarizationTools',
          'CharacterizationTools',
          'ReconstructionTools'
        ]
      }
    }
  }
}
</script>
