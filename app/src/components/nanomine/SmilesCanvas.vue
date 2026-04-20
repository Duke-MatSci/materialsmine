<template>
  <div class="smiles">
    <!--<CanvasWrapper ref="canvas-wrapper"></CanvasWrapper>-->
    <canvas :id="canvasId" ref="wrappedCanvas"></canvas>
  </div>
</template>
/* Uses code from: https://github.com/reymond-group/smilesDrawer TODO: overrides
for theme and computeOnly do not seem to be working and removed from sample */
<script setup lang="ts">
// NOTE: The old repository had a CanvasWrapper.vue to manage the canvas tag.
// It didn't seem immediately necessary, but if you're coming back to this and
// think it is, then look in the nanomine repository for that file.
// -- Rory Schadler, March 2022.
// import CanvasWrapper from './CanvasWrapper'

// eslint-disable-next-line no-unused-vars
import * as SmilesDrawer from 'smiles-drawer';
import _ from 'lodash';
import { ref, computed, watch, onMounted } from 'vue';

defineOptions({
  name: 'Smiles',
});

interface SmilesOptions {
  Padding?: number;
  atomVisualization?: string;
  explicitHydrogens?: boolean;
  terminalCarbons?: boolean;
  debug?: boolean;
  height?: number;
  width?: number;
  [key: string]: any;
}

interface Props {
  smilesOptions?: SmilesOptions;
  smilesInput?: string;
  formulaHandler?: ((formula: string) => void) | null;
  theme?: string;
  computeOnly?: boolean;
  onSuccessHandler?: (() => void) | null;
  onErrorHandler?: ((err: string) => void) | null;
}

const props = withDefaults(defineProps<Props>(), {
  smilesOptions: () => ({}),
  smilesInput: '',
  formulaHandler: null,
  theme: 'light',
  computeOnly: false,
  onSuccessHandler: null,
  onErrorHandler: null
});

// Refs
const wrappedCanvas = ref<HTMLCanvasElement | null>(null);
const smilesOptionsAdjusted = ref<SmilesOptions | null>(null);
const smilesDrawer = ref<any>(null);
const smilesValue = ref<string>('');
const smilesTheme = ref<string>(props.theme);
const smilesComputeOnly = ref<boolean>(props.computeOnly);
const provider = ref<{ context: CanvasRenderingContext2D | null }>({
  context: null
});

// Computed
const canvasId = computed(() => _.uniqueId('canvasId'));

// Methods
const getMolecularFormula = (): string => {
  return smilesDrawer.value?.getMolecularFormula() || '';
};

const getParentDimensions = (): { width: number; height: number } => {
  if (!wrappedCanvas.value || !wrappedCanvas.value.parentElement) {
    return { width: 0, height: 0 };
  }
  return {
    width: wrappedCanvas.value.parentElement.clientWidth,
    height: wrappedCanvas.value.parentElement.clientHeight
  };
};

const overrideOptions = (opts: SmilesOptions): void => {
  const parentDims = getParentDimensions();
  if (opts) {
    smilesOptionsAdjusted.value = _.clone(opts);
  } else {
    smilesOptionsAdjusted.value = {};
  }
  if (smilesOptionsAdjusted.value) {
    smilesOptionsAdjusted.value.height = parentDims.height;
    smilesOptionsAdjusted.value.width = parentDims.width;
  }
};

const clearCanvas = (): void => {
  if (!wrappedCanvas.value || !provider.value.context) return;
  const c = wrappedCanvas.value;
  provider.value.context.clearRect(0, 0, c.width, c.height);
};

const setInput = (inputStr: string): void => {
  if (inputStr) {
    smilesValue.value = inputStr;
    SmilesDrawer.parse(
      smilesValue.value,
      function (tree: any) {
        smilesDrawer.value.draw(tree, canvasId.value);
        if (props.onSuccessHandler) {
          props.onSuccessHandler();
        }
        if (props.formulaHandler) {
          props.formulaHandler(getMolecularFormula());
        }
      },
      function (err: string) {
        if (props.formulaHandler) {
          props.formulaHandler('*Error*');
        }
        if (props.onErrorHandler) {
          props.onErrorHandler(err);
        }
      }
    );
  } else {
    // clear values on empty input
    if (props.onSuccessHandler) {
      props.onSuccessHandler();
    }
    if (props.formulaHandler) {
      props.formulaHandler('');
    }
    clearCanvas(); // clear the smiles image
  }
};

const adjustDimensions = (): void => {
  if (!wrappedCanvas.value) return;
  const dim = getParentDimensions();
  wrappedCanvas.value.width = dim.width;
  wrappedCanvas.value.height = dim.height;
};

const getCanvas = (): HTMLCanvasElement | null => {
  return wrappedCanvas.value;
};

// Watchers
watch(() => props.smilesOptions, (v) => {
  overrideOptions(v);
}, { deep: true });

watch(() => props.smilesInput, (v) => {
  smilesValue.value = v;
  setInput(v);
});

watch(() => props.theme, (v) => {
  smilesTheme.value = v;
});

watch(() => props.computeOnly, (v) => {
  smilesComputeOnly.value = v;
});

// Lifecycle
onMounted(() => {
  overrideOptions(props.smilesOptions);
  smilesDrawer.value = new SmilesDrawer.Drawer(smilesOptionsAdjusted.value);
  if (wrappedCanvas.value) {
    provider.value.context = wrappedCanvas.value.getContext('2d');
  }
  adjustDimensions();
  smilesValue.value = props.smilesInput;
  setInput(props.smilesInput);
});
</script>
