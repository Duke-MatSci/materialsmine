<template>
  <div class="main tool_page pixelunit wrapper">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding">
      <div class="md-layout-item md-size-100">
        <h2>
          Data from Caltech and Duke composed of 32K simulated results for static and dynamic
          analysis.
        </h2>
        <p>
          Click pixels to create a geometry configuration and view the result for the selected
          geometry.
        </p>
        <p>
          Default material is Stratasys Vero White (Poisson's Ratio 0.33, Young's Modulus 2e9 Pa)
          and selectable material is Stratasys Tango Black (Poisson's Ratio 0.33, Young's Modulus
          2e6 Pa).
        </p>
      </div>

      <div class="md-layout-item md-size-100 md-layout md-alignment-top-left md-gutter">
        <md-button class="md-layout-item md-size-10 md-primary" @click="handleReset"
          >Reset</md-button
        >
      </div>

      <div class="md-layout-item md-size-35 md-small-size-100" style="min-width: 310px">
        <canvas id="unit-cell" ref="unitCell" width="300" height="300"></canvas>
      </div>

      <div class="md-layout-item md-size-60 md-small-size-100 md-layout md-gutter">
        <md-content class="md-primary md-layout-item md-size-100">
          <h2>Geometry Details</h2>
        </md-content>

        <md-card v-for="item in geometryItems" class="md-layout-item" :key="item.name">
          <md-card-header class="md-subheading">{{ item.name }}</md-card-header>
          <md-divider />
          <md-card-content>{{ item.value }}</md-card-content>
        </md-card>
      </div>

      <div class="md-layout-item md-size-100 md-layout md-gutter">
        <md-content class="md-primary md-layout-item md-size-100">
          <h2>Bandgap Values</h2>
        </md-content>

        <md-card class="md-layout-item md-size-100">
          <md-card-content>
            <div class="md-table md-card">
              <table class="md-table-content" style="width: 100%">
                <thead>
                  <tr>
                    <th class="md-table-head">SH</th>
                    <th class="md-table-head">PSV</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bgPair, index) in bgPairs" :key="index">
                    <td class="md-table-cell">{{ getBgValue(bgPair.sh) }}</td>
                    <td class="md-table-cell">{{ getBgValue(bgPair.psv) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </md-card-content>
        </md-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import PixelUnit from '@/modules/PixelUnit';
interface GeometryItem {
  name: string;
  value: string;
}
interface BgPair {
  sh: number;
  psv: number;
}

const store = useStore();
store.commit('setAppHeaderInfo', { icon: 'scatter_plot', name: 'Geometry Explorer' });

const errorMsg = ref('');
const unitCell = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const borderColor = ref('black');
const setColor = ref('red');
const resetColor = ref('#c0c0c0');
const bgColor = ref('rgb(192,192,192)');
const symmetry = ref('C4v');
const lw = ref(4);
const size = ref(10);
const matlabStr = ref('');
const effYmStr = ref('');
const effPrStr = ref('');
const psvStr = ref('');
const shStr = ref('');
type PixelUnitAPI = {
  pt2pixel: (x: number, y: number) => any;
  handleClick: (pixel: any) => void;
  drawGrid: () => void;
  clearCanvas: () => void;
  resetPixels: () => void;
  getPsv: () => number[];
  getSh: () => number[];
  getMatlabString: () => string;
  getPsvString: () => string;
  getShString: () => string;
  getYmString: () => string;
  getPrString: () => string;
  setMatlabString: (s: string) => void;
};
const pixelUnit = ref<PixelUnitAPI | null>(null);
const bgPairs = ref<BgPair[]>([
  { sh: 0, psv: 1 },
  { sh: 2, psv: 3 },
  { sh: 4, psv: 5 },
  { sh: 6, psv: 7 },
]);
const geometryItems = reactive<GeometryItem[]>([
  { name: 'Geometry', value: '' },
  { name: "Effective Young's Modulus (Pa)", value: '' },
  { name: "Effective Poisson's ratio", value: '' },
]);
// helpers
function getBgValue(s: number) {
  const n = Number(s);
  if (!isFinite(n)) return 'N/A';
  const fixed = n.toFixed(8);
  return fixed === 'NaN' ? 'N/A' : fixed;
}
function handleReset() {
  size.value = 10;
  if (!pixelUnit.value) return;
  pixelUnit.value.clearCanvas();
  pixelUnit.value.drawGrid();
  pixelUnit.value.resetPixels();
  updateFields();
}
function updateFields() {
  showMatlabString();
  showPSVString();
  showSHString();
  updateBgPairs();
  showYoungsModulusString();
  showPoissonsRatioString();
}
function updateBgPairs() {
  if (!pixelUnit.value) return;
  const psv = pixelUnit.value.getPsv();
  const sh = pixelUnit.value.getSh();
  bgPairs.value = psv.map((v, idx) => ({ sh: sh[idx], psv: v }));
}
function showMatlabString() {
  if (!pixelUnit.value) return;
  matlabStr.value = pixelUnit.value.getMatlabString();
  geometryItems[0].value = matlabStr.value;
}
function showPSVString() {
  if (!pixelUnit.value) return;
  psvStr.value = pixelUnit.value.getPsvString();
}
function showSHString() {
  if (!pixelUnit.value) return;
  shStr.value = pixelUnit.value.getShString();
}
function showYoungsModulusString() {
  if (!pixelUnit.value) return;
  effYmStr.value = pixelUnit.value.getYmString();
  geometryItems[1].value = effYmStr.value;
}
function showPoissonsRatioString() {
  if (!pixelUnit.value) return;
  effPrStr.value = pixelUnit.value.getPrString();
  geometryItems[2].value = effPrStr.value;
}
function onGeometryEntered(geometry: string) {
  pixelUnit.value?.setMatlabString(geometry);
}
let clickHandler: ((ev: MouseEvent) => void) | null = null;
onMounted(() => {
  if (!unitCell.value) return;
  ctx.value = unitCell.value.getContext('2d');
  clickHandler = (ev: MouseEvent) => {
    if (!pixelUnit.value) return;
    const x = (ev as any).layerX ?? (ev as any).offsetX;
    const y = (ev as any).layerY ?? (ev as any).offsetY;
    const pixel = pixelUnit.value.pt2pixel(x, y);
    pixelUnit.value.handleClick(pixel);
    updateFields();
  };
  unitCell.value.addEventListener('click', clickHandler);
  fetch(
    'https://materialsmine.org/nmstatic/metamine/lin-bilal-liu-10x10-c4v-15bit-static-dynamic.txt'
  )
    .then((res) => res.text())
    .then((text) => {
      // Pass all 11 args expected by your PixelUnit.ts
      pixelUnit.value = new (PixelUnit as any)(
        text,
        unitCell.value,
        ctx.value,
        size.value,
        lw.value,
        borderColor.value,
        setColor.value,
        resetColor.value,
        bgColor.value,
        null,
        symmetry.value
      ) as PixelUnitAPI;
      pixelUnit.value.drawGrid();
      updateFields();
    })
    .catch((err) => (errorMsg.value = err.message));
});
onBeforeUnmount(() => {
  if (unitCell.value && clickHandler) {
    unitCell.value.removeEventListener('click', clickHandler);
  }
});
</script>

<style scoped>
.md-table {
  overflow-x: auto;
}
.md-table-content {
  border-collapse: collapse;
}
.md-table-head {
  text-align: left;
  font-weight: 600;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.md-table-cell {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
