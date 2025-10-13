<template>
  <div class="main tool_page pixelunit wrapper">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding">
      <div class="md-layout-item md-size-100">
        <h2>Data from Caltech and Duke composed of 32K simulated results for static and dynamic analysis.</h2>
        <p>Click pixels to create a geometry configuration and view the result for the selected geometry.</p>
        <p>
          Default material is Stratasys Vero White (Poisson's Ratio 0.33, Young's Modulus 2e9 Pa) and selectable
          material is Stratasys Tango Black (Poisson's Ratio 0.33, Young's Modulus 2e6 Pa).
        </p>
      </div>
      <div class="md-layout-item md-size-100 md-layout md-alignment-top-left md-gutter">
        <md-button class="md-layout-item md-size-10 md-primary" @click="handleReset()">Reset</md-button>
      </div>
      <div class="md-layout-item md-size-35 md-small-size-100" style="min-width:310px;">
        <canvas id="unit-cell" ref="unitCellCanvas" width="300" height="300"></canvas>
      </div>

      <div class="md-layout-item md-size-60 md-small-size-100 md-layout md-gutter">
        <md-content class="md-primary md-layout-item md-size-100">
          <h2>Geometry Details</h2>
        </md-content>
        <md-card v-for="item of geometryItems" class="md-layout-item" :key="item.name">
          <md-card-header class="md-subheading">{{ item.name }}</md-card-header>
          <md-divider></md-divider>
          <md-card-content>{{ item.value }}</md-card-content>
        </md-card>
      </div>

      <div class="md-layout-item md-size-100 md-layout md-gutter">
        <md-content class="md-primary md-layout-item md-size-100">
          <h2>Bandgap Values</h2>
        </md-content>
        <md-table v-model="bgPairs" md-card>
          <md-table-row>
            <md-table-head>SH</md-table-head>
            <md-table-head>PSV</md-table-head>
          </md-table-row>

          <md-table-row v-for="(bgPair, index) of bgPairs" :key="index">
            <md-table-cell>{{ getBgValue(bgPair.sh) }}</md-table-cell>
            <md-table-cell>{{ getBgValue(bgPair.psv) }}</md-table-cell>
          </md-table-row>
        </md-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import PixelUnit from '@/modules/PixelUnit';

defineOptions({
  name: 'PixelUnit',
});

interface BgPair {
  id?: number;
  sh: number;
  psv: number;
}

interface GeometryItem {
  name: string;
  value: string;
}

// Data
const store = useStore();
const unitCellCanvas = ref<HTMLCanvasElement | null>(null);
const errorMsg = ref<string>('');
const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const borderColor = ref<string>('black');
const setColor = ref<string>('red');
const resetColor = ref<string>('#c0c0c0');
const bgColor = ref<string>('rgb(192,192,192)');
const lw = ref<number>(4);
const pixels = ref(null);
const size = ref<number>(10);
const pixelStrElem = ref(null);
const matlabStr = ref<string>('');
const effYmStr = ref<string>('');
const effPrStr = ref<string>('');
const psvStr = ref<string>('');
const shStr = ref<string>('');
const geometry = ref<string>('');

const bgPairs = ref<BgPair[]>([
  { sh: 0, psv: 1 },
  { sh: 2, psv: 3 },
  { sh: 4, psv: 5 },
  { sh: 6, psv: 7 }
]);

const rowsPerPageItems = ref<number[]>([4, 8, 12]);
const pagination = reactive({
  rowsPerPage: 4
});

const geometryItems = ref<GeometryItem[]>([
  {
    name: 'Geometry',
    value: ''
  },
  {
    name: "Effective Young's Modulus (Pa)",
    value: ''
  },
  {
    name: "Effective Poisson's ratio",
    value: ''
  }
]);

const pixelUnit = ref<InstanceType<typeof PixelUnit> | null>(null);

// Methods
const getBgValue = (s: number): string => {
  let v: string | number = Number.parseFloat(String(s)).toFixed(8);
  if (v === 'NaN' || !isFinite(Number(v))) {
    v = 'N/A';
  }
  return String(v);
};

const onGeometryEntered = (): void => {
  if (pixelUnit.value) {
    pixelUnit.value.setMatlabString(geometry.value);
  }
};

const updateFields = (): void => {
  showMatlabString();
  showPSVString();
  showSHString();
  updateBgPairs();
  showYoungsModulusString();
  showPoissonsRatioString();
};

const handleReset = (): void => {
  if (pixelUnit.value && canvas.value && ctx.value) {
    size.value = 10;
    pixelUnit.value.clearCanvas();
    pixelUnit.value.drawGrid();
    pixelUnit.value.resetPixels();
    updateFields();
  }
};

const updateBgPairs = (): void => {
  if (!pixelUnit.value) return;

  const psv = pixelUnit.value.getPsv();
  const sh = pixelUnit.value.getSh();
  bgPairs.value = [];

  psv.forEach((v: number, idx: number) => {
    const p: BgPair = { id: idx, sh: sh[idx], psv: v };
    bgPairs.value.push(p);
  });
};

const showMatlabString = (): void => {
  if (!pixelUnit.value) return;
  matlabStr.value = pixelUnit.value.getMatlabString();
  geometryItems.value[0].value = matlabStr.value;
};

const showPSVString = (): void => {
  if (!pixelUnit.value) return;
  psvStr.value = pixelUnit.value.getPsvString();
};

const showSHString = (): void => {
  if (!pixelUnit.value) return;
  shStr.value = pixelUnit.value.getShString();
};

const showYoungsModulusString = (): void => {
  if (!pixelUnit.value) return;
  effYmStr.value = pixelUnit.value.getYmString();
  geometryItems.value[1].value = effYmStr.value;
};

const showPoissonsRatioString = (): void => {
  if (!pixelUnit.value) return;
  effPrStr.value = pixelUnit.value.getPrString();
  geometryItems.value[2].value = effPrStr.value;
};

// Lifecycle
onMounted(() => {
  canvas.value = unitCellCanvas.value;
  if (!canvas.value) return;

  ctx.value = canvas.value.getContext('2d');
  lw.value = 4;

  canvas.value.addEventListener('click', (ev: MouseEvent) => {
    if (!pixelUnit.value) return;
    const pixel = pixelUnit.value.pt2pixel(ev.layerX, ev.layerY);
    pixelUnit.value.handleClick(pixel);
    updateFields();
  });

  fetch('https://materialsmine.org/nmstatic/metamine/lin-bilal-liu-10x10-c4v-15bit-static-dynamic.txt')
    .then(data => data.text())
    .then(text => {
      if (!canvas.value || !ctx.value) return;

      pixelUnit.value = new PixelUnit(
        text,
        canvas.value,
        ctx.value,
        size.value,
        lw.value,
        borderColor.value,
        setColor.value,
        resetColor.value,
        null,
        null
      );
      pixelUnit.value.drawGrid();
      updateFields();
    })
    .catch(err => {
      errorMsg.value = err.message;
    });

  store.commit('setAppHeaderInfo', {
    icon: 'scatter_plot',
    name: 'Geometry Explorer'
  });
});
</script>
