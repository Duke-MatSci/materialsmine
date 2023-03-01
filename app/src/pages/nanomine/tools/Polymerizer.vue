<template>
  <tool-template :card="card" name="Polymerizer" header="Polymerizer">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/prop_simu.png" alt="Propertry Simulation">
    </template>
    <template #actions>
      <a href="http://reccr.chem.rpi.edu/polymerizer/index.html" target="_blank">
        <md-button class="md-raised md-primary md-raised">
          Launch
        </md-button>
      </a>
    </template>
    <!-- shared slots -->
    <template #title>
      Polymerizer
    </template>
    <template #content>
      Polymerizer is an online application for prediction of surface energy for nanocomposites featuring
      user-defined polymer structure input and structure-property MQSPR. This web app is in collaboration with
      and maintained by Rensselaer Polytechnic Institute.
    </template>
  </tool-template>
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
  }
}
</script>
