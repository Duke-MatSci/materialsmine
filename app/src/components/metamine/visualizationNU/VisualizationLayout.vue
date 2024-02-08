<template>
  <div class="main tool_page">
    <div class="adjust-padding" style="margin: 5px 0 0 5px">
      <div class="viz-u-postion__rel">
        <button v-if="validateLinkProp" class="nuplot-button-link">
          <router-link
            :to="link.to"
            class="u--bg utility-transparentbg u--font-emph-700"
          >
            {{ link.text }}
          </router-link>
        </button>
        <div
          class="u--margin-neg md-fab md-fab-top-right u_width--max u--shadow-none u--layout-flex u--layout-flex-justify-end u--b-rad"
        >
          <md-button
            @click="hideSide"
            class="viz-u-display__ph md-fab md-dense md-primary btn--primary"
          >
            <md-tooltip>
              {{ showSide ? 'Hide Side Tools' : 'Display Side Bar' }}
            </md-tooltip>
            <md-icon> {{ showSide ? 'arrow_forward' : 'arrow_back' }}</md-icon>
          </md-button>
        </div>
      </div>
      <div
        class="main-content u_display-flex md-layout"
        :class="[dense ? 'vega-view' : 'u--margin-pos']"
      >
        <div
          id="main_chart"
          :class="[
            !showSide ? 'md-size-80' : ' md-size-50',
            'viz-u-postion__rel histogram-chart md-layout-item md-medium-size-100 viz-u-mgbottom-big'
          ]"
        >
          <slot name="main_chart">
            <div
              class="section_loader viz-u-postion__rel utility-margin-top-intro"
            >
              <spinner text="Loading Chart Data" />
            </div>
          </slot>
        </div>
        <div
          class="md-layout md-layout-item md-size-20 md-medium-size-100 u--layout-flex u--layout-flex-justify-sb u_centralize_items utility-roverflow"
        >
          <slot name="subcharts"></slot>
        </div>
        <div
          class="side-tools md-size-30 md-medium-size-100 md-layout-item md-card-header viz-u-display__show"
          :class="showSide ? 'viz-u-display__show' : 'viz-u-display__hide'"
        >
          <slot name="side_tools"></slot>
        </div>
        <div class="footer md-size-100 md-layout-item">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import spinner from '@/components/Spinner';
export default {
  name: 'VisualizationLayout',
  components: {
    spinner
  },
  data() {
    return {
      showSide: true,
      index: 1
    };
  },
  props: {
    link: {
      type: Object,
      validator: (val) =>
        Object.hasOwnProperty.call(val, 'to') &&
        Object.hasOwnProperty.call(val, 'text'),
      default: null
    },
    dense: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    async hideSide() {
      this.showSide = !this.showSide;
      this.$store.commit('metamineNU/setLoadingState', true);
      await this.$nextTick();
      this.$store.commit('metamineNU/setLoadingState', false);
    }
  },
  computed: {
    loading() {
      return this.$store.getters['metamineNU/getLoadingState'];
    },
    validateLinkProp() {
      if (!this.link || typeof this.link !== 'object') return false;
      return (
        Object.hasOwnProperty.call(this.link, 'to') &&
        Object.hasOwnProperty.call(this.link, 'text')
      );
    }
  },
  async mounted() {
    this.$store.commit('metamineNU/setRefreshStatus', true);
    await this.$store.dispatch('metamineNU/fetchMetamineDataset');
  }
};
</script>
