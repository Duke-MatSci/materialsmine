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
          v-model="inputObj.cellValue"
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
          v-model="inputObj.cellValue"
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
          v-model="inputObj.values"
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
                fileError && !inputObj.cellValuecellValue ? 'md-invalid' : '',
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
            :md-active.sync="dialogActive"
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

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'InputComponent',
  props: {
    inputObj: {
      type: Object,
      required: true
    },
    uniqueKey: {
      type: Array,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false
    }
  },
  data() {
    return {
      loading: !!this.listValue,
      error: false,
      listItem: [],
      dialogTitle: '',
      dialogText: '',
      dialogAction: '',
      dialogActive: false,
      tempFileContainer: {},
      inFocus: false
    };
  },
  computed: {
    ...mapGetters({
      token: 'auth/token'
    }),
    ...mapState({
      errors: (state) => state.explorer.curation.curationFormError
    }),
    unitOfMeasureExists() {
      return Object.hasOwnProperty.call(this.inputObj, 'unitofmeasurement');
    },
    noteExists() {
      return Object.hasOwnProperty.call(this.inputObj, 'note');
    },
    reduceSpacing() {
      return { alignItems: 'baseline', minHeight: 'auto', paddingTop: 0 };
    },
    reduceCellValue() {
      const arr = this.inputObj.cellValue.split('/');
      return arr.length > 3 ? arr[3].substring(0, 40) : this.inputObj.cellValue;
    },
    downloadLink() {
      if (this.inputObj.cellValue.includes('nmr/blob')) {
        // http:localhost/api/files/583e05f1e74a1d205f4e218c
        return `/api/files/${this.inputObj.cellValue.split('id=')?.pop()}`;
      }
      return this.inputObj.cellValue;
    },
    errorRef() {
      if (!this.title || !Object.hasOwnProperty.call(this.errors, this.title)) {
        return false;
      }
      const obj = this.errors[this.title];
      const refData = this.uniqueKey.reduce(function (o, x, idx, arr) {
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
    },
    inputError() {
      return this.errorRef && !this.inputObj.cellValue;
    },
    fileError() {
      return this.errorRef;
    },
    isEditMode() {
      return !!Object.keys(this.$route.query).length;
    },
    parent() {
      return this.uniqueKey.slice(0, this.uniqueKey.length - 1).join(' > ');
    },
    stringInputVal() {
      if (typeof this.inputObj !== 'object') return false;
      return (
        Object.hasOwnProperty.call(this.inputObj, 'cellValue') &&
        this.inputObj.cellValue !== null &&
        this.inputObj.cellValue.trim() === ''
      );
    }
  },
  watch: {
    stringInputVal(newVal) {
      if (newVal === true) {
        this.inputObj.cellValue = null;
      }
    }
  },
  methods: {
    ...mapActions({
      fetchXlsList: 'explorer/curation/fetchXlsList'
    }),
    hasProperty(obj, prop) {
      return Object.hasOwnProperty.call(obj, prop);
    },
    async fetchValues() {
      // set error and loading state
      this.loading = true;
      this.error = false;
      try {
        const result = await this.fetchXlsList({
          field: this.inputObj.validList
        });
        this.listItem = result?.columns[0]?.values || [];
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error || 'Something went wrong',
          action: () => this.fetchValues()
        });
        this.error = true;
      } finally {
        this.loading = false;
      }
    },
    toggleDialog() {
      this.dialogActive = !this.dialogActive;
    },
    confirmUpload(e) {
      if (!e) return;
      this.tempFileContainer = e.target?.files ? [...e.target?.files] : [];
      this.dialogTitle = 'Confirm Upload';
      this.dialogText = 'Are you sure you want to upload this file';
      this.dialogAction = null;
      this.dialogActive = true;
      e.target.value = null;
    },
    confirmDelete() {
      this.dialogTitle = 'Confirm Data Removal';
      const msg =
        'Removing this file would clear all fields in this block. Please confirm your action';
      const altMsg = 'This file would be permanently deleted from our server.';
      this.dialogText = this.isEditMode ? altMsg : msg;
      this.dialogAction = () => this.removeImage();
      this.dialogActive = true;
    },
    onCancel(e) {
      this.dialogTitle = '';
      this.dialogText = '';
      this.dialogAction = null;
      this.dialogActive = false;
      this.tempFileContainer = {};
    },
    onConfirm() {
      if (!this.dialogAction) return this.onInputChange(this.tempFileContainer);
      return this.dialogAction();
    },
    async onInputChange(arg) {
      this.dialogActive = false;
      try {
        const { fileLink } = await this.$store.dispatch('uploadFile', {
          file: arg
        });
        this.inputObj.cellValue = fileLink;
        this.tempFileContainer = {};
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err?.message || 'Something went wrong',
          action: () => this.onInputChange(arg)
        });
      } finally {
        this.dialogAction = null;
      }
    },
    async removeImage() {
      try {
        let fetchLink;
        if (this.inputObj.cellValue.includes('/nmr/')) {
          const blobId = this.inputObj.cellValue.split('=')[1];
          fetchLink = `/api/files/${blobId}`;
        } else {
          fetchLink = this.inputObj.cellValue;
        }

        const res = await fetch(fetchLink, {
          headers: { Authorization: `Bearer ${this.token}` },
          method: 'DELETE'
        });
        if (res.status === 200) {
          // 06/20/2024
          // Removing below code to allow complete removal of image data when an image is deleted on the curation form
          // if (this.isEditMode) return (this.inputObj.cellValue = '');
          this.$emit('data-file-deleted', this.inputObj.cellValue);
          this.inputObj.cellValue = '';
          this.onCancel();
        }
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err?.message || 'Something went wrong',
          action: () => this.removeImage()
        });
      }
    },
    async downloadImage(arg) {
      const baseUrl = window.location.origin;
      const fileUrl = `${baseUrl}${arg}`;
      const encodedUrl = encodeURI(fileUrl);
      const fileLink = document.createElement('a');
      fileLink.href = encodedUrl;
      const name = arg?.split('?')[0];
      fileLink.setAttribute('download', name);
      document.body.appendChild(fileLink);
      fileLink.click();
    }
  },
  mounted() {
    if (this.inputError || this.fileError) this.$emit('update-step-error');
  }
};
</script>
