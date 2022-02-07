<template>
  <div class="sample_page">
    <div class="sample_container">
      <SampleHeader />
      <SampleImages />
      <MaterialComponentsAndAttributes />
      <CuratedProcessingStepsParameters />
      <CuratedPropertiesOfNanocompositeSample />
      <OtherSamples />
    </div>
  </div>
</template>
<script>
import SampleHeader from '@/components/explorer/SampleHeader.vue'
import SampleImages from '@/components/explorer/SampleImages.vue'
import MaterialComponentsAndAttributes from '@/components/explorer/MaterialComponentsAndAttributes.vue'
import CuratedProcessingStepsParameters from '@/components/explorer/CuratedProcessingStepsParameters.vue'
import OtherSamples from '@/components/explorer/OtherSamples.vue'
import CuratedPropertiesOfNanocompositeSample from '@/components/explorer/CuratedPropertiesOfNanocompositeSample.vue'

export default {
  name: 'Sample',
  components: {
    SampleHeader,
    SampleImages,
    MaterialComponentsAndAttributes,
    CuratedProcessingStepsParameters,
    CuratedPropertiesOfNanocompositeSample,
    OtherSamples
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'science', name: 'Sample' })
  }
}
</script>
<style scoped>
.sample_page {
  display: flex;
  justify-content: center;
}

.sample_container {
  max-width: 1024px;
  padding: 0px 16px;
}
</style>
