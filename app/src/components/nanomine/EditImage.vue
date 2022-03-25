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
  <div class='modal' v-if='value'>
    <div class='image-cropper-container'>

      <h1>{{ computedTitle }}</h1>

      <!-- displayed when user opens image cropper -->
      <div class='imageWrapper' v-if='type === "crop"'>
        <cropper :src='file.url' :stencil-props='stencilProps' @change='onCropChange'></cropper>
      </div>

      <!-- instructions (varies based on use case) -->
      <p v-if='type === "phase"'><strong>Instructions:</strong> click on the phase within the image that you would like to be analyzed.</p>
      <p v-if='type === "calibrate"'><strong>Instruction:</strong> click and drag over the scale bar within the image to calibrate image size to scale bar.<p>

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

<script>

import { Cropper } from 'vue-advanced-cropper'

export default {
  name: 'EditImage',
  components: {
    Cropper
  },
  props: {
    value: {
      required: true
    },
    file: Object,
    type: String,
    aspectRatio: String
  },
  watch: {
    // update phase dot information when new image is opened in modal
    file: {
      deep: true,
      handler (newValue, oldValue) {
        if (newValue.name !== oldValue.name) {
          this.phaseDotVisibility = false
        }
        this.phase = newValue.phase
      }
    }
  },
  mounted () {
    // locks the aspect ratio at which the user can crop an image
    if (this.aspectRatio === 'square') {
      this.stencilProps.aspectRatio = 1
    } else if (this.aspectRatio === 'free') {
      if ('aspectRatio' in this.stencilProps) {
        delete this.stencilProps.aspectRatio
      }
    }
  },
  data () {
    return {
      title: '',
      croppedURL: null,
      coordinates: null,
      stencilProps: {},
      phase: { xOffset: 0, yOffset: 0 },
      phaseDotVisibility: false,
      calibrationLine: {
        width: 0,
        left: 0,
        top: 0,
        drawLine: false
      },
      calibratedDimensions: {
        width: 0,
        height: 0
      },
      scaleBar: {
        width: 0,
        units: null
      }
    }
  },
  methods: {
    onPhaseChange (e) {
      // takes the click offset from top left of image and multiplies that by how much the image is scaled up/down to fit the modal
      this.phase.xOffset = parseInt(e.offsetX * (this.file.pixelSize.width / e.target.clientWidth))
      this.phase.yOffset = parseInt(e.offsetY * (this.file.pixelSize.height / e.target.clientHeight))

      this.phaseDotVisibility = true
    },
    mouseDown (e) {
      this.calibrationLine.top = e.offsetY
      this.calibrationLine.left = ((this.$refs.calibrationContainer.clientWidth - e.target.clientWidth) / 2) + e.offsetX
      this.calibrationLine.width = 0
      this.calibrationLine.drawLine = true
    },
    mouseMove (e) {
      if (this.calibrationLine.drawLine === true) {
        this.calibrationLine.width = (((this.$refs.calibrationContainer.clientWidth - e.target.clientWidth) / 2) + e.offsetX) - this.calibrationLine.left
      }
      if (e.offsetX > e.target.clientWidth - 10) {
        this.drawLine = false
      }
    },
    mouseUp () {
      this.calibrationLine.drawLine = false
      this.calculateScale()
    },
    calculateScale () {
      this.calibratedDimensions.width = parseInt(this.scaleBar.width * (this.$refs.calibrationImage.clientWidth / this.calibrationLine.width))
      this.calibratedDimensions.height = parseInt(this.scaleBar.width * (this.$refs.calibrationImage.clientHeight / this.calibrationLine.width))
    },
    onCropChange ({ coordinates, canvas }) {
      this.croppedURL = canvas.toDataURL()
      this.coordinates = coordinates
    },
    closeModal () {
      this.$emit('input', !this.value)
    },
    saveImage () {
      if (this.type === 'crop') {
        this.$emit('setCroppedImage', this.croppedURL, this.file.name, this.coordinates)
      } else if (this.type === 'phase') {
        this.$emit('setPhase', this.file.name, this.phase)
      } else if (this.type === 'calibrate') {
        this.$emit('setCalibration', this.calibratedDimensions, this.scaleBar)
      }
      this.closeModal()
    }
  },

  // computed variables are for the phase dot (to determine position and toggle visibility), and modal title
  computed: {
    // phase dot position is calculated from the offset from the top left corner of its parent div

    // gives the y offset of the phase dot
    computedTop: function () {
      if (this.$refs.phaseImage === undefined) { return this.phase.yOffset * 0 } // refs are not yet rendered on first run
      var scaleFactor = this.$refs.phaseImage.clientHeight / this.file.pixelSize.height // image might be scaled up/down to fit the modal.
      return ((this.phase.yOffset * scaleFactor) - 3) + 'px' // -3 pixels to center dot on where they click
    },

    // gives the x offset of the phase dot
    computedLeft: function () {
      if (this.$refs.phaseImage === undefined) { return this.phase.xOffset * 0 } // refs are not yet rendered on first run
      var scaleFactor = this.$refs.phaseImage.clientWidth / this.file.pixelSize.width // image might be scaled up/down to fit the modal.
      var extraOffset = (this.$refs.imageWrapperDiv.clientWidth - this.$refs.phaseImage.clientWidth) / 2 // phase dot is anchored to the div that contains img. Div width may be larger than img width.
      return ((this.phase.xOffset * scaleFactor) + extraOffset - 3) + 'px' // -3 pixels to center dot on where they click
    },

    // computed background and computed border determine whether phase dot is displayed

    computedBackground: function () {
      if (this.phaseDotVisibility === true) {
        return 'white'
      } else {
        return 'transparent'
      }
    },
    computedBorder: function () {
      if (this.phaseDotVisibility === true) {
        return '1px solid black'
      } else {
        return '1px solid transparent'
      }
    },

    // determines the title of the modal
    computedTitle: function () {
      if (this.type === 'crop') {
        return 'Crop image'
      } else if (this.type === 'phase') {
        return 'Set phase'
      } else if (this.type === 'calibrate') {
        return 'Scale bar calibration'
      } else {
        return ''
      }
    }
  }
}
</script>
