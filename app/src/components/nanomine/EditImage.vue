<!--
################################################################################
#
# File Name: EditImage.vue
# Application: templates
# Description: a modal that allows the user to edit the selected image. Current functionality includes cropping the image and setting the phase.
#
# Created by: Atul Jalan 6/20/20
# Customized for NanoMine
#
################################################################################
-->

<template>
  <div class='u_display-flex editImage_modal' v-if='modelValue'>
    <div class='image-cropper-container'>

      <h1>{{ computedTitle }}</h1>

      <!-- displayed when user opens image cropper -->
      <div class='imageWrapper' v-if='type === "crop"'>
        <cropper :src='file.url' :stencil-props='stencilProps' @change='onCropChange'></cropper>
      </div>

      <!-- instructions (varies based on use case) -->
      <p v-if='type === "phase"'><strong>Instructions:</strong> click on the phase within the image that you would like to be analyzed.</p>
      <p v-if='type === "calibrate"'><strong>Instruction:</strong> click and drag over the scale bar within the image to calibrate image size to scale bar.</p>

      <!-- displayed when user opens phase select -->
      <div class='relative imageWrapper' v-if='type === "phase"' ref='imageWrapperDiv'>
        <img class='image' :src='file.url' @click='onPhaseChange($event)' ref='phaseImage'>
        <div class='phaseDot' v-bind:style="{ top: computedTop, left: computedLeft, backgroundColor: computedBackground, border: computedBorder}"></div>
      </div>

      <!-- displayed when user opens calibration tool -->
      <div class='relative imageWrapper' v-if='type === "calibrate"' ref='calibrationContainer'>
        <img class='image' :src='file.url' draggable='false' ref='calibrationImage' @mousedown='mouseDown($event)' @mousemove='mouseMove($event)' @mouseup='mouseUp()'>
        <div class='calibrationLine' ref='calibrationLine' v-bind:style="{width: calibrationLine.width + 'px', top: calibrationLine.top + 'px', left: calibrationLine.left + 'px'}" @mouseup='mouseUp()'></div>
      </div>

      <!-- displayed when user opens calibration tool -->
      <div class='scale-bar-inputs' v-if='type === "calibrate"'>

        <div>
          <md-field>
            <label>Scale bar width</label>
            <md-input v-model="scaleBar.width" @change="calculateScale()"></md-input>
          </md-field>
        </div>

        <div>
          <md-field>
            <label>Scale bar units</label>
            <md-select v-model="scaleBar.units">
              <md-option value="nanometers">Nanometers (nm)</md-option>
              <md-option value="micrometers">Micrometers (µM)</md-option>
              <md-option value="millimeters">Millimeters (mm)</md-option>
            </md-select>
          </md-field>
        </div>

      </div>

      <div class='image-cropper-container-buttons'>
        <p v-if='type === "phase"'>x-offset: {{ phase.xOffset }}</p> <!-- only displayed when user opens phase select -->
        <p v-if='type === "phase"'>y-offset: {{ phase.yOffset }}</p> <!-- only displayed when user opens phase select -->
        <p v-if='type === "calibrate"'>width: {{ calibratedDimensions.width }}</p> <!-- only displayed when user opens phase select -->
        <p v-if='type === "calibrate"'>height: {{ calibratedDimensions.height }}</p> <!-- only displayed when user opens phase select -->
        <md-button class="md-primary" @click='closeModal()'>Cancel</md-button>
        <md-button class="md-primary" @click='saveImage()'>Save</md-button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Cropper } from 'vue-advanced-cropper';

defineOptions({
  name: 'EditImage',
});

interface Props {
  modelValue: boolean;
  file: FileData;
  type: 'crop' | 'phase' | 'calibrate';
  aspectRatio: 'square' | 'free';
}

interface FileData {
  url: string;
  name: string;
  pixelSize: {
    width: number;
    height: number;
  };
  phase: {
    x_offset: number;
    y_offset: number;
  };
}

interface Coordinates {
  width: number;
  height: number;
  left: number;
  top: number;
}

interface Phase {
  xOffset: number;
  yOffset: number;
}

interface CalibratedDimensions {
  width: number;
  height: number;
}

interface ScaleBar {
  width: number;
  units: string | null;
}

interface StencilProps {
  aspectRatio?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'setCroppedImage', croppedURL: string | null, fileName: string, coordinates: Coordinates | null): void;
  (e: 'setPhase', fileName: string, phase: Phase): void;
  (e: 'setCalibration', dimensions: CalibratedDimensions, scaleBar: ScaleBar): void;
}>();

// Refs
const imageWrapperDiv = ref<HTMLDivElement | null>(null);
const phaseImage = ref<HTMLImageElement | null>(null);
const calibrationContainer = ref<HTMLDivElement | null>(null);
const calibrationImage = ref<HTMLImageElement | null>(null);
const calibrationLine = ref<HTMLDivElement | null>(null);

// Data
const title = ref<string>('');
const croppedURL = ref<string | null>(null);
const coordinates = ref<Coordinates | null>(null);
const stencilProps = ref<StencilProps>({});
const phase = ref<Phase>({ xOffset: 0, yOffset: 0 });
const phaseDotVisibility = ref<boolean>(false);
const calibrationLineData = ref({
  width: 0,
  left: 0,
  top: 0,
  drawLine: false
});
const calibratedDimensions = ref<CalibratedDimensions>({
  width: 0,
  height: 0
});
const scaleBar = ref<ScaleBar>({
  width: 0,
  units: null
});

// Computed
const computedTop = computed<string>(() => {
  if (phaseImage.value === null) { return phase.value.yOffset * 0 + 'px'; } // refs are not yet rendered on first run
  const scaleFactor = phaseImage.value.clientHeight / props.file.pixelSize.height; // image might be scaled up/down to fit the modal.
  return ((phase.value.yOffset * scaleFactor) - 3) + 'px'; // -3 pixels to center dot on where they click
});

const computedLeft = computed<string>(() => {
  if (phaseImage.value === null || imageWrapperDiv.value === null) { return phase.value.xOffset * 0 + 'px'; } // refs are not yet rendered on first run
  const scaleFactor = phaseImage.value.clientWidth / props.file.pixelSize.width; // image might be scaled up/down to fit the modal.
  const extraOffset = (imageWrapperDiv.value.clientWidth - phaseImage.value.clientWidth) / 2; // phase dot is anchored to the div that contains img. Div width may be larger than img width.
  return ((phase.value.xOffset * scaleFactor) + extraOffset - 3) + 'px'; // -3 pixels to center dot on where they click
});

const computedBackground = computed<string>(() => {
  if (phaseDotVisibility.value === true) {
    return 'white';
  } else {
    return 'transparent';
  }
});

const computedBorder = computed<string>(() => {
  if (phaseDotVisibility.value === true) {
    return '1px solid black';
  } else {
    return '1px solid transparent';
  }
});

const computedTitle = computed<string>(() => {
  if (props.type === 'crop') {
    return 'Crop image';
  } else if (props.type === 'phase') {
    return 'Set phase';
  } else if (props.type === 'calibrate') {
    return 'Scale bar calibration';
  } else {
    return '';
  }
});

// Methods
const onPhaseChange = (e: MouseEvent): void => {
  const target = e.target as HTMLImageElement;
  // takes the click offset from top left of image and multiplies that by how much the image is scaled up/down to fit the modal
  phase.value.xOffset = parseInt(String(e.offsetX * (props.file.pixelSize.width / target.clientWidth)));
  phase.value.yOffset = parseInt(String(e.offsetY * (props.file.pixelSize.height / target.clientHeight)));

  phaseDotVisibility.value = true;
};

const mouseDown = (e: MouseEvent): void => {
  const target = e.target as HTMLImageElement;
  calibrationLineData.value.top = e.offsetY;
  if (calibrationContainer.value) {
    calibrationLineData.value.left = ((calibrationContainer.value.clientWidth - target.clientWidth) / 2) + e.offsetX;
  }
  calibrationLineData.value.width = 0;
  calibrationLineData.value.drawLine = true;
};

const mouseMove = (e: MouseEvent): void => {
  const target = e.target as HTMLImageElement;
  if (calibrationLineData.value.drawLine === true && calibrationContainer.value) {
    calibrationLineData.value.width = (((calibrationContainer.value.clientWidth - target.clientWidth) / 2) + e.offsetX) - calibrationLineData.value.left;
  }
  if (e.offsetX > target.clientWidth - 10) {
    calibrationLineData.value.drawLine = false;
  }
};

const mouseUp = (): void => {
  calibrationLineData.value.drawLine = false;
  calculateScale();
};

const calculateScale = (): void => {
  if (calibrationImage.value) {
    calibratedDimensions.value.width = parseInt(String(scaleBar.value.width * (calibrationImage.value.clientWidth / calibrationLineData.value.width)));
    calibratedDimensions.value.height = parseInt(String(scaleBar.value.width * (calibrationImage.value.clientHeight / calibrationLineData.value.width)));
  }
};

const onCropChange = ({ coordinates: coords, canvas }: { coordinates: Coordinates; canvas: HTMLCanvasElement }): void => {
  croppedURL.value = canvas.toDataURL();
  coordinates.value = coords;
};

const closeModal = (): void => {
  emit('update:modelValue', !props.modelValue);
};

const saveImage = (): void => {
  if (props.type === 'crop') {
    emit('setCroppedImage', croppedURL.value, props.file.name, coordinates.value);
  } else if (props.type === 'phase') {
    emit('setPhase', props.file.name, phase.value);
  } else if (props.type === 'calibrate') {
    emit('setCalibration', calibratedDimensions.value, scaleBar.value);
  }
  closeModal();
};

// Watchers
watch(() => props.file, (newValue, oldValue) => {
  if (newValue.name !== oldValue.name) {
    phaseDotVisibility.value = false;
  }
  phase.value = {
    xOffset: newValue.phase.x_offset,
    yOffset: newValue.phase.y_offset
  };
}, { deep: true });

// Lifecycle
onMounted(() => {
  // locks the aspect ratio at which the user can crop an image
  if (props.aspectRatio === 'square') {
    stencilProps.value.aspectRatio = 1;
  } else if (props.aspectRatio === 'free') {
    if ('aspectRatio' in stencilProps.value) {
      delete stencilProps.value.aspectRatio;
    }
  }
});
</script>
