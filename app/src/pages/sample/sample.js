import SampleViewTitle from './components/SampleViewTitle.vue'
import SampleImages from './components/SampleImages.vue'
import MaterialComponentsAndAttributes from './components/MaterialComponentsAndAttributes.vue'
import CuratedProcessingStepsParameters from './components/CuratedProcessingStepsParameters.vue'
import OtherSamples from './components/OtherSamples.vue'
export default {
  name: 'Sample',
  data () {
    return {
      route: ''
    }
  },
  components: {
    SampleViewTitle,
    SampleImages,
    MaterialComponentsAndAttributes,
    CuratedProcessingStepsParameters,
    OtherSamples
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'science', name: 'Sample' })
    this.route = this.$route.params.label
  },
  beforeRouteUpdate (to, from, next) {
    this.route = to.params.label
    next()
  }
}
