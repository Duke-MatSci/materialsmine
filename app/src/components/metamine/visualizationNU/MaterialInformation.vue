<template>
  <div class="material-info-wrapper">
    <div
      style="font-size: 20px; font-weight: bold; padding: 0px"
    >
      Material Information
    </div>
    <div class="u_display-flex u_centralize_items ">
      <div
        style="background: 'white', border: '1px solid black', width: '10px', height: '10px'"
      ></div>
      <h3 style="margin: '0 10px'">Constituent Material 0 Properties</h3>
    </div>
    <div class="u_display-flex u_centralize_items">Type: {{ dataPoint && dataPoint['CM0'] }}</div>
    <div class="u_display-flex u_centralize_items">
      Young's Modulus: {{ dataPoint && dataPoint['CM0_E'] }}
    </div>
    <div class="u_display-flex u_centralize_items">
      Poisson's Ratio: {{ dataPoint && dataPoint['CM0_nu'] }}
    </div>

    <div class="u_display-flex u_centralize_items">
      <div
        style="background: 'black', border: '1px solid black', width: '10px', height: '10px'"
      ></div>
      <h3 style="margin: '0 10px'">Constituent Material 1 Properties</h3>
    </div>
    <div class="u_display-flex u_centralize_items">Type: {{ dataPoint && dataPoint['CM1'] }}</div>
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
