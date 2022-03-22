<template>
  <tool-set-template :pageContent="pageContent" :card="card"></tool-set-template>
</template>
<script>
export default {
  name: 'ModuleTools',
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
        name: 'ModuleTools',
        title: 'Statistical Learning and Analysis Module Tools',
        text: 'Statistical learning and analysis modules include web and downloadable packages that can be used to pre-process ' +
      'and analyze structure and material property data. Each of the modules will specify the required input format and output data, and provide ' +
      'a brief introduction behind the mechanism of the algorithm.',
        link: 'module_homepage',
        tools: [
          'Dynamfit'
        ],
        toolSets: [
          'MCRTools'
        ]
      }
    }
  }
}
</script>
