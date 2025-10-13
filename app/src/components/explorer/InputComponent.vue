<template>
  <div class="md-card-actions viz-u-display__show">
    <template v-if="typeof inputObj === 'object'">
      <md-field
        :class="[inputError ? 'md-invalid' : '']"
        v-if="inputObj.type === 'String'"
        md-dense
        :style="reduceSpacing"
      >
        <p
          class="u--color-grey-sec"
          :class="[name.length >= 15 ? 'md-caption' : 'md-body-2 ']"
          style="margin-right: 4px"
        >
          {{ name }}:
        </p>
        <md-input
          v-model="cellValue"
          :required="inputObj.required"
          :name="uniqueKey.join(',')"
          :id="uniqueKey.join(',')"
          :placeholder="noteExists ? inputObj.note : ''"
          :disabled="uniqueKey.includes('Control_ID')"
        ></md-input>
        <span class="md-error">Input Required</span>
        <span v-if="unitOfMeasureExists" class="md-body-1">{{
          inputObj.unitofmeasurement
        }}</span>
        <md-tooltip v-if="!!parent" md-direction="top">{{ parent }}</md-tooltip>
      </md-field>

      <md-field
        :class="[inputError ? 'md-invalid' : '']"
        v-else-if="inputObj.type === 'List'"
        :style="reduceSpacing"
      >
        <md-select
          v-model="cellValue"
          :name="uniqueKey.join(',')"
          :id="uniqueKey.join(',')"
          @md-opened="fetchValues"
          :placeholder="`Please choose ${name}`"
          :md-dense="true"
          md-align-trigger
        >
          <md-option disabled>Select Options</md-option>
          <md-option v-if="loading" disabled>Loading</md-option>
          <template v-else>
            <md-option
              v-if="!!inputObj.cellValue && !listItem.length"
              :value="inputObj.cellValue"
              >{{ inputObj.cellValue }}</md-option
            >
            <md-option v-for="(item, id) in listItem" :key="id" :value="item">{{
              item
            }}</md-option>
          </template>
        </md-select>
        <span class="md-error">Input Required</span>
        <md-tooltip md-direction="top">{{ parent }}</md-tooltip>
        <md-tooltip v-if="unitOfMeasureExists" md-direction="right">{{
          inputObj.unitofmeasurement
        }}</md-tooltip>
      </md-field>

      <div
        class="md-card-actions u--padding-zero"
        v-else-if="inputObj.type === 'replace_nested'"
      >
        <md-chips
          :class="[inputError ? 'md-invalid' : '', 'md-primary']"
          v-model="valuesArray"
          :md-placeholder="`Enter ${name}`"
          :md-auto-insert="true"
        >
          <md-tooltip md-direction="top">{{ parent }}</md-tooltip>
          <span class="md-error">Input Required</span>
        </md-chips>
        <md-button class="md-icon-button md-dense">
          <md-tooltip md-direction="top">Add New {{ name }}</md-tooltip>
          <md-icon>add</md-icon>
        </md-button>
      </div>

      <div v-else-if="inputObj.type === 'File'">
        <div
          v-if="!!inputObj.cellValue"
          class="md-layout md-alignment-center-space-between"
        >
          <p class="md-body-2" :class="[fileError ? 'u--color-error' : '']">
            {{ reduceCellValue }}...
            <md-tooltip md-direction="top">{{ downloadLink }}</md-tooltip>
          </p>

          <md-button
            class="md-icon-button"
            @click="downloadImage(downloadLink)"
          >
            <md-icon>download</md-icon>
            <md-tooltip md-direction="top">Click to download file</md-tooltip>
          </md-button>
          <md-button class="md-icon-button" @click="confirmDelete">
            <md-icon>delete_forever</md-icon>
            <md-tooltip md-direction="top">Click to remove file</md-tooltip>
          </md-button>
        </div>
        <label v-else :for="uniqueKey.join(',')">
          <div class="form__file-input">
            <div
              :style="reduceSpacing"
              :class="[
                fileError && !inputObj.cellValue ? 'md-invalid' : '',
                inputObj.required ? 'md-required md-has-file' : '',
                'md-field md-theme-default'
              ]"
            >
              <md-icon>attach_file</md-icon>
              <label style="top: 4px" :for="uniqueKey.join(',')"
                >Select {{ name }} to upload</label
              >
              <div class="md-file">
                <input
                  @change="confirmUpload"
                  type="file"
                  :name="uniqueKey.join(',')"
                  :id="uniqueKey.join(',')"
                />
              </div>
              <span class="md-error" style="margin-left: 40px"
                >At least one file is required</span
              >
            </div>
            <md-tooltip md-direction="top">{{ parent }}</md-tooltip>
          </div>
        </label>
      </div>

      <div v-else>
        Input Type <span class="md-title">'{{ inputObj.type }}'</span> not valid
      </div>

      <template v-if="dialogActive">
        <div>
          <md-dialog-confirm
            :md-click-outside-to-close="false"
            v-model:md-active="dialogActive"
            :md-title="dialogTitle"
            :md-content="dialogText"
            md-confirm-text="Proceed"
            md-cancel-text="Cancel"
            @md-cancel="onCancel"
            @md-confirm="onConfirm"
          />
        </div>
      </template>
    </template>
    <p class="md-body u--color-error" v-else>inputObj prop not provided</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

// Component name for debugging
defineOptions({
  name: 'InputComponent',
});

// Props
interface InputObj {
  type: string;
  cellValue?: string | null;
  values?: string[];
  required?: boolean;
  note?: string;
  unitofmeasurement?: string;
  validList?: string;
}

interface Props {
  inputObj: InputObj;
  uniqueKey: string[];
  name: string;
  title?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'data-file-deleted', value: string): void;
  (e: 'update-step-error'): void;
  (e: 'update:inputObj', value: InputObj): void;
}>();

// Store and route
const store = useStore();
const route = useRoute();

// Reactive data
const loading = ref(false);
const error = ref(false);
const listItem = ref<string[]>([]);
const dialogTitle = ref('');
const dialogText = ref('');
const dialogAction = ref<(() => void) | null>(null);
const dialogActive = ref(false);
const tempFileContainer = ref<File[]>([]);
const inFocus = ref(false);

// Computed
const token = computed(() => store.getters['auth/token']);
const errors = computed(() => store.state.explorer.curation.curationFormError);

const unitOfMeasureExists = computed(() => {
  return Object.hasOwnProperty.call(props.inputObj, 'unitofmeasurement');
});

const noteExists = computed(() => {
  return Object.hasOwnProperty.call(props.inputObj, 'note');
});

const reduceSpacing = computed(() => {
  return { alignItems: 'baseline', minHeight: 'auto', paddingTop: 0 };
});

const reduceCellValue = computed(() => {
  if (!props.inputObj.cellValue) return '';
  const arr = props.inputObj.cellValue.split('/');
  return arr.length > 3 ? arr[3].substring(0, 40) : props.inputObj.cellValue;
});

const downloadLink = computed(() => {
  if (!props.inputObj.cellValue) return '';
  if (props.inputObj.cellValue.includes('nmr/blob')) {
    return `/api/files/${props.inputObj.cellValue.split('id=')?.pop()}`;
  }
  return props.inputObj.cellValue;
});

const errorRef = computed(() => {
  if (!props.title || !Object.hasOwnProperty.call(errors.value, props.title)) {
    return false;
  }
  const obj = errors.value[props.title];
  const refData = props.uniqueKey.reduce(function (o: any, x: string, idx: number, arr: string[]) {
    if (typeof o === 'undefined' || o === null) return o;
    if (Array.isArray(o[x])) {
      for (let i = 0; i < o[x].length; i++) {
        if (Object.hasOwnProperty.call(o[x][i], arr[idx + 1])) {
          return o[x][i];
        }
      }
    }
    return o[x];
  }, obj);
  return !!refData;
});

const inputError = computed(() => {
  return errorRef.value && !props.inputObj.cellValue;
});

const fileError = computed(() => {
  return errorRef.value;
});

const isEditMode = computed(() => {
  return !!Object.keys(route.query).length;
});

const parent = computed(() => {
  return props.uniqueKey.slice(0, props.uniqueKey.length - 1).join(' > ');
});

const stringInputVal = computed(() => {
  if (typeof props.inputObj !== 'object') return false;
  return (
    Object.hasOwnProperty.call(props.inputObj, 'cellValue') &&
    props.inputObj.cellValue !== null &&
    props.inputObj.cellValue !== undefined &&
    props.inputObj.cellValue.trim() === ''
  );
});

// Computed with getter/setter for v-model bindings to avoid prop mutation
const cellValue = computed({
  get: () => props.inputObj.cellValue,
  set: (value) => {
    emit('update:inputObj', { ...props.inputObj, cellValue: value });
  }
});

const valuesArray = computed({
  get: () => props.inputObj.values,
  set: (value) => {
    emit('update:inputObj', { ...props.inputObj, values: value });
  }
});

// Watch
watch(stringInputVal, (newVal) => {
  if (newVal === true) {
    cellValue.value = null;
  }
});

// Methods
const hasProperty = (obj: any, prop: string) => {
  return Object.hasOwnProperty.call(obj, prop);
};

const fetchValues = async () => {
  loading.value = true;
  error.value = false;
  try {
    const result = await store.dispatch('explorer/curation/fetchXlsList', {
      field: props.inputObj.validList
    });
    listItem.value = result?.columns[0]?.values || [];
  } catch (err) {
    store.commit('setSnackbar', {
      message: err || 'Something went wrong',
      action: () => fetchValues()
    });
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const toggleDialog = () => {
  dialogActive.value = !dialogActive.value;
};

const confirmUpload = (e: Event) => {
  if (!e) return;
  const target = e.target as HTMLInputElement;
  tempFileContainer.value = target?.files ? Array.from(target.files) : [];
  dialogTitle.value = 'Confirm Upload';
  dialogText.value = 'Are you sure you want to upload this file';
  dialogAction.value = null;
  dialogActive.value = true;
  target.value = '';
};

const confirmDelete = () => {
  dialogTitle.value = 'Confirm Data Removal';
  const msg =
    'Removing this file would clear all fields in this block. Please confirm your action';
  const altMsg = 'This file would be permanently deleted from our server.';
  dialogText.value = isEditMode.value ? altMsg : msg;
  dialogAction.value = () => removeImage();
  dialogActive.value = true;
};

const onCancel = () => {
  dialogTitle.value = '';
  dialogText.value = '';
  dialogAction.value = null;
  dialogActive.value = false;
  tempFileContainer.value = [];
};

const onConfirm = () => {
  if (!dialogAction.value) return onInputChange(tempFileContainer.value);
  return dialogAction.value();
};

const onInputChange = async (arg: File[]) => {
  dialogActive.value = false;
  try {
    const { fileLink } = await store.dispatch('uploadFile', {
      file: arg
    });
    cellValue.value = fileLink;
    tempFileContainer.value = [];
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => onInputChange(arg)
    });
  } finally {
    dialogAction.value = null;
  }
};

const removeImage = async () => {
  try {
    let fetchLink: string;
    if (props.inputObj.cellValue && props.inputObj.cellValue.includes('/nmr/')) {
      const blobId = props.inputObj.cellValue.split('=')[1];
      fetchLink = `/api/files/${blobId}`;
    } else {
      fetchLink = props.inputObj.cellValue || '';
    }

    const res = await fetch(fetchLink, {
      headers: { Authorization: `Bearer ${token.value}` },
      method: 'DELETE'
    });
    if (res.status === 200) {
      emit('data-file-deleted', props.inputObj.cellValue as string);
      cellValue.value = '';
      onCancel();
    }
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => removeImage()
    });
  }
};

const downloadImage = (arg: string) => {
  const baseUrl = window.location.origin;
  const fileUrl = `${baseUrl}${arg}`;
  const encodedUrl = encodeURI(fileUrl);
  const fileLink = document.createElement('a');
  fileLink.href = encodedUrl;
  const name = arg?.split('?')[0];
  fileLink.setAttribute('download', name);
  document.body.appendChild(fileLink);
  fileLink.click();
};

// Lifecycle
onMounted(() => {
  if (inputError.value || fileError.value) emit('update-step-error');
});
</script>
