<template>
  <tool-set-template name="ModuleTools" :card="card" header="Tools">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="module_homepage">
        <md-button class="md-raised md-primary md-raised">
          See Statistical Learning and Analysis Module Tools
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Statistical Learning and Analysis Module Tools
    </template>
    <template #content>
      Statistical learning and analysis modules include web and downloadable packages that can be used to pre-process
      and analyze structure and material property data. Each of the modules will specify the required input format and
      output data, and provide a brief introduction behind the mechanism of the algorithm.
    </template>
    <!-- tool page-specific slots-->
    <template #cards>
      <mcr-tools card></mcr-tools>
      <dynamfit card></dynamfit>
    </template>
  </tool-set-template>
</template>
<script>
import ToolSetTemplate from './ToolSetTemplate.vue'
import Dynamfit from '../tools/dynamfitTool/Dynamfit.vue'
import MCRTools from './MCRTools.vue'

export default {
  name: 'ModuleTools',
  components: {
    ToolSetTemplate,
    'mcr-tools': MCRTools,
    Dynamfit
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
