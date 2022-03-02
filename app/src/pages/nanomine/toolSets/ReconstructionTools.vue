<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
export default {
  name: 'ReconstructionTools',
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
        imageFile: 'nanomine/Microstructure_Reconstruction.png',
        name: 'ReconstructionTools',
        link: 'reconstruction_homepage',
        title: 'Microstructure Reconstruction',
        description: 'Reconstruction involves constructing a statistically equivalent microstructure image' +
        'given some statistical characterization. In most cases,' +
        'reconstruction is cast as an optimization problem; with the goal of matching characteristics of' +
        'reconstructed image to that of input image.' +
        'In this section, you can upload a binary microstructure image / set of images and obtain 2D/3D' +
        'reconstructions using method of your choice.',
        display: true,
        text: 'Choose the reconstruction method from the options below. Note that uploaded images will be binarized using Otsu method.',
        tools: [
          'CorrelationReconstruct',
          'DescriptorReconstruct',
          'SDFReconstruct',
          'TransferLearning'
        ]
      }
    }
  }
}
</script>
