<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
export default {
  name: 'SimulationTools',
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
        name: 'SimulationTools',
        link: 'simtools',
        title: 'Material Property Simulation',
        text: 'We provide online version of physics-based simulation tools that take advantage of our most recent ' +
      'development in viscoelasticity and dielectric relaxation theories for interphase analysis in nanocomposites, ' +
      'statistical structure-property correlation models, as well as materials optimization methods.',
        display: true,
        tools: [
          'Polymerizer'
        ]
      }
    }
  }
}
</script>
