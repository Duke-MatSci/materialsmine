<!--
################################################################################
#
# File Name: ImageUpload.vue
# Application: templates
# Description: A reusable component that allows users to upload files. Used for Microstructure Characterization & Reconstruction jobs.
#
# Created by: Atul Jalan 6/23/20
# Customized for NanoMine
# Migrated by: Rory Schadler 2/21/22
#
################################################################################
-->

<template>
  <div class="md-layout-item md-size-100 md-layout md-alignment-top-left section_imageUpload">

    <!-- file upload button -->
    <div class="md-layout-item fileButtonWrapper">
      <md-button class="md-primary fileButton" @click='$refs.myUpload.click()'>Browse files</md-button>
      <input type="file" style="display: none" :accept="acceptFileTypes" ref="myUpload" @change="uploadFiles">
    </div>

    <!-- image dimension input section -->
    <div v-if="fileUploaded && collectDimensions && filesEditable" class="md-layout-item md-size-100">

      <h4 class='subheader'>Image Dimensions</h4>

      <div class='imageDimensionsWrapper'>

        <div class='imgDimWidth'>
          <md-field>
            <label>Width</label>
            <md-input v-model='inputtedDimensions.width' @change="userDimensionsCallback"></md-input>
          </md-field>
        </div>

        <h3>x</h3>

        <div class='imgDimHeight'>
          <md-field>
            <label>Height</label>
            <md-input v-model='inputtedDimensions.height' @change="userDimensionsCallback"></md-input>
          </md-field>
        </div>

        <div class='imgDimUnits'>
          <md-field>
            <label>Units</label>
            <md-select v-model="inputtedDimensions.units" @change="userDimensionsCallback">
              <md-option value="nanometers">Nanometers (nm)</md-option>
              <md-option value="micrometers">Micrometers (µM)</md-option>
              <md-option value="millimeters">Millimeters (mm)</md-option>
            </md-select>
          </md-field>
        </div>

        <md-button v-if='filesEditable' class='imgDimButton md-primary' @click="openImageEditor(0, 'calibrate')">
          Scale Bar Calibration Tool
        </md-button>
      </div>

    </div>

    <!-- parameters that are specific to job type -->
    <div v-if="fileUploaded && (selects && selects.length > 0)" class="md-layout-item md-size-100">

      <h4 class='subheader'>Parameters</h4>

      <div class='selectDropdownsWrapper'>
        <div class='singleSelectDropdown' v-for="(select, index) in selects" :key='index'>

          <md-field v-if="'options' in select">
            <label>{{ select.title }}</label>
            <md-select :label="select.title" v-model="selectedOptions[select.submitJobTitle]"
              @change="$emit('set-selectors', selectedOptions)">
              <md-option v-for="option of select.options" :key="option" :value="option">{{ option }}</md-option>
            </md-select>
          </md-field>

          <div v-else>
            <md-field @change="$emit('set-selectors', selectedOptions)">
              <label>{{ select.title }}</label>
              <md-input v-model="selectedOptions[select.submitJobTitle]"></md-input>
            </md-field>
          </div>

        </div>
      </div>

    </div>

    <!-- image cropper & phase selection modal -->
    <EditImage v-model='imageEditorOpen' :file='imageEditorData' :aspectRatio='aspectRatio' :type='editImageType'
      @setCroppedImage="cropCallback" @setPhase="phaseCallback" @setCalibration="calibrationCallback"></EditImage>

    <!-- table of uploaded images -->
    <!-- <div v-if="fileUploaded" class='imageTable md-layout-item md-size-100'>

      <div class='imageTableHeader'>
        <h4>Name</h4>
        <h4>Size</h4>
        <div class='tooltipWrapper'>
          <h4>Selected phase</h4>
          <md-tooltip md-direction="top">
            <template v-slot:activator="{ on, attrs }">
              <md-icon v-bind="attrs" v-on="on">mdi-information</md-icon>
            </template>
            <span>Select which phase to analyze for each image</span>
          </md-tooltip>
        </div>
        <h4>Options</h4>
      </div>

      <div class='imageTableContents' v-for="(file, index) in displayedFiles" :key='file.name'>

        <p>{{ file.name }}</p>

        <p :key='file.pixelSize.width'><span v-if="dimensionsEntered" :key='file.size.height'>{{ file.size.width }} x {{
            file.size.height }} {{ file.size.units }} / </span>{{ file.pixelSize.width }} x {{ file.pixelSize.height }}
          pixels <span v-if='file.errors.size' class='imageSizeError'>ERROR</span></p>

        <p v-if="file.phase.x_offset !== 0 || file.phase.y_offset !== 0">Manually set (x-offset: {{ file.phase.x_offset
          }}px, y-offset: {{ file.phase.y_offset }}px)</p>
        <p v-else>Preset (bright phase)</p>

        <div class='imageTableButtons' v-if='filesEditable'>
          <v-btn small class='imageTableButton' :key='index' v-on:click="openImageEditor(index, 'crop')" color="primary">
            Crop image</v-btn>
          <v-btn small class='imageTableButton' :key='index' v-on:click="openImageEditor(index, 'phase')" color="primary">
            Set phase</v-btn>
        </div>

      </div>

    </div> -->

  </div>
</template>

<script>

import EditImage from './EditImage.vue' // image cropping modal
import Jszip from 'jszip' // for unzipping and rezipping files

export default {
  name: 'ImageUpload',

  components: {
    EditImage
  },

  props: {
    aspectRatio: String,
    selects: Array,
    collectDimensions: Boolean,
    acceptFileTypes: String
  },

  data () {
    return {

      submissionFile: {},
      displayedFiles: [],
      selectedOptions: {},

      filesEditable: true,
      errorAlert: { count: 0, text: 'Error: selected phase for one or more images falls outside the image(s). This is likely due to cropping the image after setting the phase.' },

      dimensionsEntered: false,
      inputtedDimensions: { units: null, width: 0, height: 0 },

      imageEditorOpen: false,
      imageEditorData: { url: null, name: null, phase: { x_offset: null, y_offset: null } },
      editImageType: 'crop'

    }
  },

  computed: {

    fileUploaded: function () {
      if (this.displayedFiles.length > 0) {
        return true
      }
      return false
    }

  },

  methods: {

    // process uploaded files
    uploadFiles: function (e) {
      // initial variable declaration and input validation
      const inputFile = e.target.files[0]
      if (inputFile === undefined) { return }

      // reset file information
      this.submissionFile = {}
      this.displayedFiles = []
      this.filesEditable = true
      if ('phase' in this.selectedOptions) { delete this.selectedOptions.phase }
      if ('dimensions' in this.selectedOptions) {
        this.selectedOptions.dimensions = { units: this.inputtedDimensions.units, width: parseInt(this.inputtedDimensions.width), height: parseInt(this.inputtedDimensions.height), ratio: null }
      }
      this.$emit('set-selectors', this.selectedOptions)

      const fr = new FileReader()
      fr.readAsDataURL(inputFile)
      fr.addEventListener('load', async () => {
        // get file information
        this.submissionFile = {
          name: inputFile.name.toLowerCase(),
          url: fr.result,
          fileType: inputFile.name.split('.').pop().toLowerCase()
        }

        // push to parent
        this.$emit('setFiles', this.submissionFile)

        // push to displayed files
        if (this.submissionFile.fileType === 'zip') {
          this.unzipUploadedFiles(inputFile) // function unzips contents, sets editable status and gets image dimensions
        } else {
          var lowerCaseName = inputFile.name.toLowerCase()
          this.displayedFiles = [{
            name: lowerCaseName,
            originalName: lowerCaseName,
            url: fr.result,
            fileType: lowerCaseName.split('.').pop(),
            size: { width: 0, height: 0, units: null },
            pixelSize: { width: 0, height: 0 },
            phase: { x_offset: 0, y_offset: 0 },
            errors: { size: false }
          }]
          this.getInitialDimensions(0) // set pixel dimensions for image
          if (this.displayableFileType(0) === false) { this.filesEditable = false } // set displayable status for image
          this.pushPhase(0)
          this.pushImageDimensions()
          // console.log(this.displayedFiles[0].size.width, this.displayedFiles[0].pixelSize.width)
        }
      })
    },

    getInitialDimensions: function (index) {
      if (this.displayableFileType(index) === false) { return }

      var img = new Image()
      img.src = this.displayedFiles[index].url
      const vm = this
      img.onload = function () {
        vm.displayedFiles[index].pixelSize = { width: img.width, height: img.height }
        vm.displayedFiles[index].originalSize = { width: img.width, height: img.height }
        vm.updateUserDimensions(index)
        vm.displayedFiles[index].name += ' '
        vm.pushImageDimensions()
      }
    },

    // unzip if the user uploads a zip file
    unzipUploadedFiles: function (inputFile) {
      // initial variable declaration
      const jszipObj = new Jszip()

      // unzip
      jszipObj.loadAsync(inputFile)
        .then(async function (zip) {
          // transform contents to base64
          Object.keys(zip.files).forEach(function (filename) {
            zip.files[filename].async('base64')
              .then(function (fileData) {
                var lowerCaseName = filename.toLowerCase()
                var filetype = lowerCaseName.split('.').pop()
                this.displayedFiles.push({
                  name: lowerCaseName,
                  originalName: lowerCaseName,
                  url: 'data:image/' + filetype + ';base64,' + fileData,
                  fileType: filetype,
                  size: { width: 0, height: 0, units: null },
                  pixelSize: { width: 0, height: 0 },
                  phase: { x_offset: 0, y_offset: 0 },
                  errors: { size: false }
                })
              })
              .then(function () {
                this.getInitialDimensions(this.displayedFiles.length - 1) // get image dimensions
                this.pushPhase(this.displayedFiles.length - 1)
                this.pushImageDimensions()
                if (this.displayableFileType(this.displayedFiles.length - 1) === false) { this.filesEditable = false } // reduce functionality if image is tif or mat
              })
          })
        })
    },

    calibrationCallback: function (...args) {
      this.inputtedDimensions.width = args[0].width
      this.inputtedDimensions.height = args[0].height
      this.inputtedDimensions.units = args[1].units
      this.userDimensionsCallback()
    },

    // callback function for when users enter data into the image dimensions section
    userDimensionsCallback: function () {
      if (this.inputtedDimensions.units !== null && parseInt(this.inputtedDimensions.width) > 0 && parseInt(this.inputtedDimensions.height) > 0) {
        this.dimensionsEntered = true
        for (let i = 0; i < this.displayedFiles.length; i++) { this.updateUserDimensions(i) }
        this.pushImageDimensions()
      }
    },

    // emit image dimensions data back to parent
    pushImageDimensions: function () {
      if (this.displayableFileType(0) === true) {
        var ratio = this.displayedFiles[0].size.width / this.displayedFiles[0].pixelSize.width

        if (this.inputtedDimensions.units === 'nanometers') {
          ratio = ratio / 1000000000
        } else if (this.inputtedDimensions.units === 'micrometers') {
          ratio = ratio / 1000000
        } else if (this.inputtedDimensions.units === 'millimeters') {
          ratio = ratio / 1000
        }

        this.selectedOptions.dimensions = { units: this.inputtedDimensions.units, width: this.displayedFiles[0].size.width, height: this.displayedFiles[0].size.height, ratio: ratio }
      } else {
        this.selectedOptions.dimensions = { units: this.inputtedDimensions.units, width: parseInt(this.inputtedDimensions.width), height: parseInt(this.inputtedDimensions.height), ratio: null }
      }
      this.$emit('set-selectors', this.selectedOptions)
    },

    // scale user inputted dimensions by how much user has cropped the images
    updateUserDimensions: function (index) {
      this.displayedFiles[index].size.units = this.inputtedDimensions.units
      this.displayedFiles[index].size.width = parseInt((parseInt(this.inputtedDimensions.width) / this.displayedFiles[index].originalSize.width) * this.displayedFiles[index].pixelSize.width)
      this.displayedFiles[index].size.height = parseInt((parseInt(this.inputtedDimensions.height) / this.displayedFiles[index].originalSize.height) * this.displayedFiles[index].pixelSize.height)
    },

    // args: [fileName, phase]
    phaseCallback: function (...args) {
      // find index of object to change in array
      const indexFunction = (object) => object.name === args[0]
      const index = this.displayedFiles.findIndex(indexFunction)

      // apply new phase
      this.displayedFiles[index].phase = args[1]
      if (this.displayedFiles[index].errors.size === true) {
        this.displayedFiles[index].errors.size = false
        this.errorAlert.count -= 1
      }

      this.displayedFiles[index].name += ' ' // force rerender

      // push to parent
      this.pushPhase(index)
    },

    pushPhase: function (index) {
      if ('phase' in this.selectedOptions) {
        this.selectedOptions.phase[this.displayedFiles[index].originalName] = this.displayedFiles[index].phase
      } else {
        this.selectedOptions.phase = {}
        this.selectedOptions.phase[this.displayedFiles[index].originalName] = this.displayedFiles[index].phase
      }
      this.$emit('set-selectors', this.selectedOptions)
    },

    // args: [cropped image, filename of cropped image, coordinates]
    cropCallback: async function (...args) {
      for (let i = 0; i < this.displayedFiles.length; i++) {
        if (this.displayedFiles[i].name === args[1]) {
          await this.cropImage(args[0], args[2], i)
        } else if (this.displayableFileType(i) === false) {
          continue
        } else {
          await this.cropImage(null, args[2], i)
        }

        this.displayedFiles[i].name = 'cropped_' + this.displayedFiles[i].name // force rerender
      }

      // push to parent
      if (this.submissionFile.fileType === 'zip') {
        this.rezipFiles()
      } else {
        this.submissionFile.url = this.displayedFiles[0].url
        this.$emit('setFiles', this.submissionFile)
      }
      this.pushImageDimensions()
      for (let i = 0; i < this.displayedFiles.length; i++) { this.pushPhase(i) }
    },

    // crops a single image: update the image, the image's phase, and the image dimensions
    cropImage: async function (url, coordinates, index) {
      function awaitImageCrop (image) {
        return new Promise((resolve, reject) => {
          image.onload = function () {
            ctx.drawImage(image, (-1) * coordinates.left, (-1) * coordinates.top)
            this.displayedFiles[index].url = canvas.toDataURL()
            resolve()
          }
        })
      }

      // crop the image
      if (url !== null) {
        this.displayedFiles[index].url = url
      } else {
        var canvas = document.createElement('canvas')
        canvas.width = coordinates.width
        canvas.height = coordinates.height

        var ctx = canvas.getContext('2d')
        var image = new Image()
        image.src = this.displayedFiles[index].url

        await awaitImageCrop(image) // done to ensure that all images are cropped before files are rezipped
      }

      // update the phase based on new top left of image
      if (this.displayedFiles[index].phase.x_offset !== 0 || this.displayedFiles[index].phase.y_offset !== 0) {
        this.displayedFiles[index].phase.x_offset -= coordinates.left
        this.displayedFiles[index].phase.y_offset -= coordinates.top

        // validate that new phase is still within the image
        if (this.displayedFiles[index].phase.x_offset < 0 || this.displayedFiles[index].phase.y_offset < 0) {
          this.errorAlert.count += 1
          this.displayedFiles[index].errors.size = true
        } else if (this.displayedFiles[index].phase.x_offset > coordinates.width || this.displayedFiles[index].phase.y_offset > coordinates.height) {
          this.errorAlert.count += 1
          this.displayedFiles[index].errors.size = true
        }
      }

      // update the image dimensions
      this.displayedFiles[index].pixelSize.width = coordinates.width
      this.displayedFiles[index].pixelSize.height = coordinates.height

      if (this.dimensionsEntered === true) {
        this.updateUserDimensions(index)
      }
    },

    // rezip images when images are altered and emit that back to parent component
    async rezipFiles () {
      const jszipObj = new Jszip()

      // add images to zip file
      for (let i = 0; i < this.displayedFiles.length; i++) {
        jszipObj.file(this.displayedFiles[i].originalName, this.displayedFiles[i].url.split(',').pop(), { base64: true })
      }

      // create zip file
      jszipObj.generateAsync({ type: 'base64', compression: 'DEFLATE' })
        .then(function (base64) {
          this.submissionFile.url = 'data:application/zip;base64,' + base64
          this.$emit('setFiles', this.submissionFile)
        })
    },

    // opens image editor modal and passes information for specific image that is opened
    openImageEditor: function (index, type) {
      this.editImageType = type
      this.imageEditorData = this.displayedFiles[index]
      this.imageEditorOpen = !this.imageEditorOpen // toggle the image editor modal being open and closed
    },

    displayableFileType: function (index) {
      if (this.displayedFiles === []) {
        return false
      } else if (this.displayedFiles[index].fileType === 'mat' || this.displayedFiles[index].fileType === 'tif') {
        return false
      }
      return true
    }
  },
  watch: {
    // info alert that functionality is restricted if the user uploads tif or mat file type
    filesEditable: function (newValue, oldValue) {
      if (newValue) {
        this.$emit('fileTypeAlert', {
          title: 'File Type Alert',
          content: 'Note: due to browser limitations, image editing functionality and pulling data about image dimensions ' +
            'is not available for mat and tif file types. But, these file types can still be submitted for jobs.',
          reason: 'fileTypeAlert'
        })
      }
    },

    // show error alert if count of errors is greater than 0
    errorAlert: function () {
      if (this.errorAlert.count) {
        this.$emit('errorAlert', {
          title: 'Likely Cropping Error',
          content: this.errorAlert.text,
          reason: 'croppingError'
        })
      }
    }
  }
}
</script>
