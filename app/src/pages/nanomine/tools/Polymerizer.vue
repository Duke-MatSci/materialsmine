<template>
  <tool-template :tool="tool" :card="card"></tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'Polymerizer',
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
        name: 'Polymerizer',
        title: 'Polymerizer',
        link: 'http://reccr.chem.rpi.edu/polymerizer/index.html',
        externalLink: true,
        text: 'Polymerizer is an online application for prediction of surface energy for nanocomposites featuring ' +
      'user-defined polymer structure input and structure-property MQSPR. This web app is in collaboration with ' +
      'and maintained by Rensselaer Polytechnic Institute.',
        imageFile: 'nanomine/prop_simu.png',
        display: true
      }
    }
  }
}
</script>
