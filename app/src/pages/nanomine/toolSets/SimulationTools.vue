<template>
  <tool-set-template name="SimulationTools" :card="card" header="Material Property Simulation">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="simtools">
        <md-button class="md-raised md-primary md-raised">
          Launch
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Material Property Simulation
    </template>
    <template #content>
      We provide online version of physics-based simulation tools that take advantage of our most recent
      development in viscoelasticity and dielectric relaxation theories for interphase analysis in nanocomposites,
      statistical structure-property correlation models, as well as materials optimization methods.
    </template>
    <!-- tool page-specific slots-->
    <template #cards>
      <polymerizer card></polymerizer>
    </template>
  </tool-set-template>
</template>
<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import Polymerizer from '../tools/Polymerizer.vue'
export default {
  name: 'SimulationTools',
  components: {
    ToolSetTemplate,
    Polymerizer
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
