<template>
  <div class="material-info-wrapper">
    <div
      style="font-size: 20px; font-weight: bold; padding: 0px"
    >
      Material Information
    </div>
    <div class="mat-subtitle-line">
      <div
        style="background: 'white', border: '1px solid black', width: '10px', height: '10px'"
      ></div>
      <h3 style="margin: '0 10px'">Constituent Material 0 Properties</h3>
    </div>
    <div class="mat-content-line">Type: {{ dataPoint?.CM0 }}</div>
    <div class="mat-content-line">
      Young&apos;s Modulus: {{ dataPoint?.CM0_E }}
    </div>
    <div class="mat-content-line">
      Poisson&apos;s Ratio: {{ dataPoint?.CM0_nu }}
    </div>

    <div class="mat-subtitle-line">
      <div
        style="background: 'black', border: '1px solid black', width: '10px', height: '10px'"
      ></div>
      <h3 style="margin: '0 10px'">Constituent Material 1 Properties</h3>
    </div>
    <div class="mat-content-line">Type: {{ dataPoint?.CM1 }}</div>
    <div class="mat-content-line">
      Young&apos;s Modulus: {{ dataPoint?.CM1_E }}
    </div>
    <div class="mat-content-line">
      Poisson&apos;s Ratio: {{ dataPoint?.CM1_nu }}
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "MaterialInformation",
  computed: {
    ...mapState("metamineNU", {
      dataPoint: (state) => state.dataPoint,
    }),
  },
};
</script>

<style>
.mat-subtitle-line {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.mat-content-line {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
