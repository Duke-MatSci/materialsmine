import SampleHeader from "./components/SampleHeader.vue";
import SampleImages from "./components/SampleImages.vue";
import MaterialComponentsAndAttributes from "./components/MaterialComponentsAndAttributes.vue";
import CuratedProcessingStepsParameters from "./components/CuratedProcessingStepsParameters.vue";
import OtherSamples from "./components/OtherSamples.vue";
import CuratedPropertiesOfNanocompositeSample from "./components/CuratedPropertiesOfNanocompositeSample.vue";

export default {
  name: "Sample",
  components: {
    SampleHeader,
    SampleImages,
    MaterialComponentsAndAttributes,
    CuratedProcessingStepsParameters,
    CuratedPropertiesOfNanocompositeSample,
    OtherSamples,
  },
  created() {
    this.$store.commit("setAppHeaderInfo", { icon: "science", name: "Sample" });
  },
};
