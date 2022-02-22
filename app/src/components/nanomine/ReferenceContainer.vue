<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100" v-if="references.length">
      <h4 v-if="referenceOpen" @click="refOpen">References <i class="material-icons icon-adjust">keyboard_arrow_up</i></h4>
      <h4 v-else @click="refOpen">References <i class="material-icons icon-adjust">keyboard_arrow_down</i></h4>
    </div>
    <div class="md-layout-item md-size-100" v-if="referenceOpen">
      <p v-for="ref in references" :key="ref.title" class="reference">{{ ref.authors }}, {{ ref.title }}, <i>{{ ref.venue }}</i>, {{ ref.date }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReferenceContainer',
  props: {
    references: {
      type: Array,
      required: true
    },
    openOnLoad: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  data: () => {
    return {
      referenceOpen: false
    }
  },
  methods: {
    refOpen: function () {
      this.referenceOpen = !this.referenceOpen
    }
  },
  mounted () {
    this.referenceOpen = this.openOnLoad
  }
}
</script>
<style scoped lang="scss">
.reference {
  padding-left: 36px;
  text-indent: -36px;
}
</style>
