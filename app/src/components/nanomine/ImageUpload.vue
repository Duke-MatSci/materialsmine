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
  <div
    class="md-layout-item md-size-100 md-layout md-alignment-top-left section_imageUpload"
  >
    <!-- file upload button -->
    <div class="md-layout-item fileButtonWrapper">
      <md-button class="md-primary fileButton" @click="myUpload?.click()"
        >Browse files</md-button
      >
      <input
        type="file"
        style="display: none"
        :accept="acceptFileTypes"
        ref="myUpload"
        @change="uploadFiles"
      />
    </div>

    <!-- image dimension input section -->
    <div
      v-if="fileUploaded && collectDimensions && filesEditable"
      class="md-layout-item md-size-100"
    >
      <h4 class="subheader">Image Dimensions</h4>

      <div class="imageDimensionsWrapper">
        <div class="imgDimWidth">
          <md-field>
            <label>Width</label>
            <md-input
              v-model="inputtedDimensions.width"
              @change="userDimensionsCallback"
            ></md-input>
          </md-field>
        </div>

        <h3>x</h3>

        <div class="imgDimHeight">
          <md-field>
            <label>Height</label>
            <md-input
              v-model="inputtedDimensions.height"
              @change="userDimensionsCallback"
            ></md-input>
          </md-field>
        </div>

        <div class="imgDimUnits">
          <md-field>
            <label>Units</label>
            <md-select
              v-model="inputtedDimensions.units"
              @change="userDimensionsCallback"
            >
              <md-option value="nanometers">Nanometers (nm)</md-option>
              <md-option value="micrometers">Micrometers (µM)</md-option>
              <md-option value="millimeters">Millimeters (mm)</md-option>
            </md-select>
          </md-field>
        </div>

        <md-button
          v-if="filesEditable"
          class="imgDimButton md-primary"
          @click="openImageEditor(0, 'calibrate')"
        >
          Scale Bar Calibration Tool
        </md-button>
      </div>
    </div>

    <!-- parameters that are specific to job type -->
    <div
      v-if="fileUploaded && selects && selects.length > 0"
      class="md-layout-item md-size-100"
    >
      <h4 class="subheader">Parameters</h4>

      <div class="selectDropdownsWrapper">
        <div
          class="singleSelectDropdown"
          v-for="(select, index) in selects"
          :key="index"
        >
          <md-field v-if="'options' in select">
            <label>{{ select.title }}</label>
            <md-select
              :label="select.title"
              v-model="selectedOptions[select.submitJobTitle]"
              @change="emit('set-selectors', selectedOptions)"
            >
              <md-option
                v-for="option of select.options"
                :key="option"
                :value="option"
                >{{ option }}</md-option
              >
            </md-select>
          </md-field>

          <div v-else>
            <md-field @change="emit('set-selectors', selectedOptions)">
              <label>{{ select.title }}</label>
              <md-input
                v-model="selectedOptions[select.submitJobTitle]"
              ></md-input>
            </md-field>
          </div>
        </div>
      </div>
    </div>

    <!-- image cropper & phase selection modal -->
    <EditImage
      v-model="imageEditorOpen"
      :file="imageEditorData"
      :aspectRatio="aspectRatio"
      :type="editImageType"
      @setCroppedImage="cropCallback"
      @setPhase="phaseCallback"
      @setCalibration="calibrationCallback"
    ></EditImage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import EditImage from './EditImage.vue'; // image cropping modal
import Jszip from 'jszip'; // for unzipping and rezipping files

defineOptions({
  name: 'ImageUpload',
});

interface Props {
  aspectRatio: 'square' | 'free';
  selects?: SelectOption[];
  collectDimensions: boolean;
  acceptFileTypes: string;
}

interface SelectOption {
  title: string;
  submitJobTitle: string;
  options?: string[];
}

interface SubmissionFile {
  name?: string;
  url?: string;
  fileType?: string;
}

interface DisplayedFile {
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: {
    width: number;
    height: number;
    units: string | null;
  };
  pixelSize: {
    width: number;
    height: number;
  };
  originalSize?: {
    width: number;
    height: number;
  };
  phase: {
    x_offset: number;
    y_offset: number;
  };
  errors: {
    size: boolean;
  };
}

interface Coordinates {
  width: number;
  height: number;
  left: number;
  top: number;
}

interface Phase {
  x_offset: number;
  y_offset: number;
}

interface CalibratedDimensions {
  width: number;
  height: number;
}

interface ScaleBar {
  width: number;
  units: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selects: () => []
});

const emit = defineEmits<{
  (e: 'setFiles', file: SubmissionFile): void;
  (e: 'set-selectors', options: Record<string, any>): void;
  (e: 'fileTypeAlert', data: { title: string; content: string; reason: string }): void;
  (e: 'errorAlert', data: { title: string; content: string; reason: string }): void;
}>();

// Refs
const myUpload = ref<HTMLInputElement | null>(null);
const submissionFile = ref<SubmissionFile>({});
const displayedFiles = ref<DisplayedFile[]>([]);
const selectedOptions = ref<Record<string, any>>({});
const filesEditable = ref<boolean>(true);
const errorAlert = ref({
  count: 0,
  text: 'Error: selected phase for one or more images falls outside the image(s). This is likely due to cropping the image after setting the phase.'
});
const dimensionsEntered = ref<boolean>(false);
const inputtedDimensions = ref<{ units: string | null; width: number; height: number }>({
  units: null,
  width: 0,
  height: 0
});
const imageEditorOpen = ref<boolean>(false);
const imageEditorData = ref<DisplayedFile>({
  url: '',
  name: '',
  originalName: '',
  fileType: '',
  size: { width: 0, height: 0, units: null },
  pixelSize: { width: 0, height: 0 },
  phase: { x_offset: 0, y_offset: 0 },
  errors: { size: false }
});
const editImageType = ref<'crop' | 'phase' | 'calibrate'>('crop');

// Computed
const fileUploaded = computed<boolean>(() => {
  return displayedFiles.value.length > 0;
});

// Methods
const uploadFiles = (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const inputFile = target.files?.[0];
  if (inputFile === undefined) {
    return;
  }

  // reset file information
  submissionFile.value = {};
  displayedFiles.value = [];
  filesEditable.value = true;
  if ('phase' in selectedOptions.value) {
    delete selectedOptions.value.phase;
  }
  if ('dimensions' in selectedOptions.value) {
    selectedOptions.value.dimensions = {
      units: inputtedDimensions.value.units,
      width: parseInt(String(inputtedDimensions.value.width)),
      height: parseInt(String(inputtedDimensions.value.height)),
      ratio: null
    };
  }
  emit('set-selectors', selectedOptions.value);

  const fr = new FileReader();
  fr.readAsDataURL(inputFile);
  fr.addEventListener('load', async () => {
    // get file information
    submissionFile.value = {
      name: inputFile.name.toLowerCase(),
      url: fr.result as string,
      fileType: inputFile.name.split('.').pop()?.toLowerCase()
    };

    // push to parent
    emit('setFiles', submissionFile.value);

    // push to displayed files
    if (submissionFile.value.fileType === 'zip') {
      unzipUploadedFiles(inputFile); // function unzips contents, sets editable status and gets image dimensions
    } else {
      const lowerCaseName = inputFile.name.toLowerCase();
      displayedFiles.value = [
        {
          name: lowerCaseName,
          originalName: lowerCaseName,
          url: fr.result as string,
          fileType: lowerCaseName.split('.').pop() || '',
          size: { width: 0, height: 0, units: null },
          pixelSize: { width: 0, height: 0 },
          phase: { x_offset: 0, y_offset: 0 },
          errors: { size: false }
        }
      ];
      getInitialDimensions(0); // set pixel dimensions for image
      if (displayableFileType(0) === false) {
        filesEditable.value = false;
      } // set displayable status for image
      pushPhase(0);
      pushImageDimensions();
    }
  });
};

const getInitialDimensions = (index: number): void => {
  if (displayableFileType(index) === false) {
    return;
  }

  const img = new Image();
  img.src = displayedFiles.value[index].url;
  img.onload = function () {
    displayedFiles.value[index].pixelSize = {
      width: img.width,
      height: img.height
    };
    displayedFiles.value[index].originalSize = {
      width: img.width,
      height: img.height
    };
    updateUserDimensions(index);
    displayedFiles.value[index].name += ' ';
    pushImageDimensions();
  };
};

// unzip if the user uploads a zip file
const unzipUploadedFiles = (inputFile: File): void => {
  const jszipObj = new Jszip();

  jszipObj.loadAsync(inputFile).then(async function (zip) {
    Object.keys(zip.files).forEach(function (filename) {
      zip.files[filename]
        .async('base64')
        .then(function (fileData) {
          const lowerCaseName = filename.toLowerCase();
          const filetype = lowerCaseName.split('.').pop() || '';
          displayedFiles.value.push({
            name: lowerCaseName,
            originalName: lowerCaseName,
            url: 'data:image/' + filetype + ';base64,' + fileData,
            fileType: filetype,
            size: { width: 0, height: 0, units: null },
            pixelSize: { width: 0, height: 0 },
            phase: { x_offset: 0, y_offset: 0 },
            errors: { size: false }
          });
        })
        .then(function () {
          getInitialDimensions(displayedFiles.value.length - 1); // get image dimensions
          pushPhase(displayedFiles.value.length - 1);
          pushImageDimensions();
          if (
            displayableFileType(displayedFiles.value.length - 1) ===
            false
          ) {
            filesEditable.value = false;
          } // reduce functionality if image is tif or mat
        });
    });
  });
};

const calibrationCallback = (dimensions: CalibratedDimensions, scaleBarData: ScaleBar): void => {
  inputtedDimensions.value.width = dimensions.width;
  inputtedDimensions.value.height = dimensions.height;
  inputtedDimensions.value.units = scaleBarData.units;
  userDimensionsCallback();
};

// callback function for when users enter data into the image dimensions section
const userDimensionsCallback = (): void => {
  if (
    inputtedDimensions.value.units !== null &&
    parseInt(String(inputtedDimensions.value.width)) > 0 &&
    parseInt(String(inputtedDimensions.value.height)) > 0
  ) {
    dimensionsEntered.value = true;
    for (let i = 0; i < displayedFiles.value.length; i++) {
      updateUserDimensions(i);
    }
    pushImageDimensions();
  }
};

// emit image dimensions data back to parent
const pushImageDimensions = (): void => {
  if (displayableFileType(0) === true) {
    let ratio =
      displayedFiles.value[0].size.width /
      displayedFiles.value[0].pixelSize.width;

    if (inputtedDimensions.value.units === 'nanometers') {
      ratio = ratio / 1000000000;
    } else if (inputtedDimensions.value.units === 'micrometers') {
      ratio = ratio / 1000000;
    } else if (inputtedDimensions.value.units === 'millimeters') {
      ratio = ratio / 1000;
    }

    selectedOptions.value.dimensions = {
      units: inputtedDimensions.value.units,
      width: displayedFiles.value[0].size.width,
      height: displayedFiles.value[0].size.height,
      ratio: ratio
    };
  } else {
    selectedOptions.value.dimensions = {
      units: inputtedDimensions.value.units,
      width: parseInt(String(inputtedDimensions.value.width)),
      height: parseInt(String(inputtedDimensions.value.height)),
      ratio: null
    };
  }
  emit('set-selectors', selectedOptions.value);
};

// scale user inputted dimensions by how much user has cropped the images
const updateUserDimensions = (index: number): void => {
  displayedFiles.value[index].size.units = inputtedDimensions.value.units;
  if (displayedFiles.value[index].originalSize) {
    displayedFiles.value[index].size.width = parseInt(
      String((parseInt(String(inputtedDimensions.value.width)) /
        displayedFiles.value[index].originalSize!.width) *
        displayedFiles.value[index].pixelSize.width)
    );
    displayedFiles.value[index].size.height = parseInt(
      String((parseInt(String(inputtedDimensions.value.height)) /
        displayedFiles.value[index].originalSize!.height) *
        displayedFiles.value[index].pixelSize.height)
    );
  }
};

const phaseCallback = (fileName: string, phaseData: { xOffset: number; yOffset: number }): void => {
  // find index of object to change in array
  const indexFunction = (object: DisplayedFile) => object.name === fileName;
  const index = displayedFiles.value.findIndex(indexFunction);

  // apply new phase
  displayedFiles.value[index].phase = {
    x_offset: phaseData.xOffset,
    y_offset: phaseData.yOffset
  };
  if (displayedFiles.value[index].errors.size === true) {
    displayedFiles.value[index].errors.size = false;
    errorAlert.value.count -= 1;
  }

  displayedFiles.value[index].name += ' '; // force rerender

  // push to parent
  pushPhase(index);
};

const pushPhase = (index: number): void => {
  if ('phase' in selectedOptions.value) {
    selectedOptions.value.phase[displayedFiles.value[index].originalName] =
      displayedFiles.value[index].phase;
  } else {
    selectedOptions.value.phase = {};
    selectedOptions.value.phase[displayedFiles.value[index].originalName] =
      displayedFiles.value[index].phase;
  }
  emit('set-selectors', selectedOptions.value);
};

const cropCallback = async (croppedImage: string | null, filename: string, coordinates: Coordinates | null): Promise<void> => {
  if (!coordinates) return;

  for (let i = 0; i < displayedFiles.value.length; i++) {
    if (displayedFiles.value[i].name === filename) {
      await cropImage(croppedImage, coordinates, i);
    } else if (displayableFileType(i) === false) {
      continue;
    } else {
      await cropImage(null, coordinates, i);
    }

    displayedFiles.value[i].name = 'cropped_' + displayedFiles.value[i].name; // force rerender
  }

  // push to parent
  if (submissionFile.value.fileType === 'zip') {
    rezipFiles();
  } else {
    submissionFile.value.url = displayedFiles.value[0].url;
    emit('setFiles', submissionFile.value);
  }
  pushImageDimensions();
  for (let i = 0; i < displayedFiles.value.length; i++) {
    pushPhase(i);
  }
};

// crops a single image: update the image, the image's phase, and the image dimensions
const cropImage = async (url: string | null, coordinates: Coordinates, index: number): Promise<void> => {
  function awaitImageCrop (image: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
      image.onload = function () {
        ctx.drawImage(image, -1 * coordinates.left, -1 * coordinates.top);
        displayedFiles.value[index].url = canvas.toDataURL();
        resolve();
      };
    });
  }

  // crop the image
  if (url !== null) {
    displayedFiles.value[index].url = url;
  } else {
    var canvas = document.createElement('canvas');
    canvas.width = coordinates.width;
    canvas.height = coordinates.height;

    var ctx = canvas.getContext('2d')!;
    var image = new Image();
    image.src = displayedFiles.value[index].url;

    await awaitImageCrop(image); // done to ensure that all images are cropped before files are rezipped
  }

  // update the phase based on new top left of image
  if (
    displayedFiles.value[index].phase.x_offset !== 0 ||
    displayedFiles.value[index].phase.y_offset !== 0
  ) {
    displayedFiles.value[index].phase.x_offset -= coordinates.left;
    displayedFiles.value[index].phase.y_offset -= coordinates.top;

    // validate that new phase is still within the image
    if (
      displayedFiles.value[index].phase.x_offset < 0 ||
      displayedFiles.value[index].phase.y_offset < 0
    ) {
      errorAlert.value.count += 1;
      displayedFiles.value[index].errors.size = true;
    } else if (
      displayedFiles.value[index].phase.x_offset > coordinates.width ||
      displayedFiles.value[index].phase.y_offset > coordinates.height
    ) {
      errorAlert.value.count += 1;
      displayedFiles.value[index].errors.size = true;
    }
  }

  // update the image dimensions
  displayedFiles.value[index].pixelSize.width = coordinates.width;
  displayedFiles.value[index].pixelSize.height = coordinates.height;

  if (dimensionsEntered.value === true) {
    updateUserDimensions(index);
  }
};

// rezip images when images are altered and emit that back to parent component
const rezipFiles = async (): Promise<void> => {
  const jszipObj = new Jszip();

  // add images to zip file
  for (let i = 0; i < displayedFiles.value.length; i++) {
    jszipObj.file(
      displayedFiles.value[i].originalName,
      displayedFiles.value[i].url.split(',').pop() || '',
      { base64: true }
    );
  }

  // create zip file
  jszipObj
    .generateAsync({ type: 'base64', compression: 'DEFLATE' })
    .then(function (base64) {
      submissionFile.value.url = 'data:application/zip;base64,' + base64;
      emit('setFiles', submissionFile.value);
    });
};

// opens image editor modal and passes information for specific image that is opened
const openImageEditor = (index: number, type: 'crop' | 'phase' | 'calibrate'): void => {
  editImageType.value = type;
  imageEditorData.value = displayedFiles.value[index];
  imageEditorOpen.value = !imageEditorOpen.value; // toggle the image editor modal being open and closed
};

const displayableFileType = (index: number): boolean => {
  if (!displayedFiles.value.length) {
    return false;
  } else if (
    displayedFiles.value[index].fileType === 'mat' ||
    displayedFiles.value[index].fileType === 'tif'
  ) {
    return false;
  }
  return true;
};

// Watchers
watch(filesEditable, (newValue) => {
  if (!newValue) {
    emit('fileTypeAlert', {
      title: 'File Type Alert',
      content:
        'Note: due to browser limitations, image editing functionality and pulling data about image dimensions ' +
        'is not available for mat and tif file types. But, these file types can still be submitted for jobs.',
      reason: 'fileTypeAlert'
    });
  }
});

watch(() => errorAlert.value.count, (newValue) => {
  if (newValue) {
    emit('errorAlert', {
      title: 'Likely Cropping Error',
      content: errorAlert.value.text,
      reason: 'croppingError'
    });
  }
});
</script>
