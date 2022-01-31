<template>
  <div id="sample_page">
    <SampleHeader />
    <SampleImages />
    <MaterialComponentsAndAttributes />
    <CuratedProcessingStepsParameters />
    <CuratedPropertiesOfNanocompositeSample />
    <OtherSamples />
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
