<template>
  <div class="material-info-wrapper">
    <div class="u_margin-top-small md-title u--padding-zero u--font-emph-700">
      Material Information
    </div>
    <div class="u_display-flex u_centralize_items viz-u-mgbottom-sm">
      <div
        class="utility-gridborder utility-content__result-dark u_margin-none"
      ></div>
      <div>&nbsp; &nbsp;</div>
      <h3>Constituent Material 0 Properties</h3>
    </div>
    <div class="u_display-flex u_centralize_items">
      Type: {{ dataPoint && dataPoint['CM0'] }}
    </div>
    <div class="u_display-flex u_centralize_items">
      Young's Modulus: {{ dataPoint && dataPoint['CM0_E'] }}
    </div>
    <div class="u_display-flex u_centralize_items">
      Poisson's Ratio: {{ dataPoint && dataPoint['CM0_nu'] }}
    </div>

    <div class="u_display-flex u_centralize_items">
      <div
        class="utility-bg-dark utility-gridborder utility-content__result-dark u_margin-none"
      ></div>
      <div>&nbsp; &nbsp;</div>
      <h3>Constituent Material 1 Properties</h3>
    </div>
    <div class="u_display-flex u_centralize_items">
      Type: {{ dataPoint && dataPoint['CM1'] }}
    </div>
    <div class="u_display-flex u_centralize_items">
      Young's Modulus: {{ dataPoint && dataPoint['CM1_E'] }}
    </div>
    <div class="u_display-flex u_centralize_items">
      Poisson's Ratio: {{ dataPoint && dataPoint['CM1_nu'] }}
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'MaterialInformation',
  computed: {
    ...mapState('metamineNU', {
      dataPoint: (state) => state.dataPoint
    })
  }
}
</script>
