<template>
  <div class="xml">
    <dialog-box :active="dialogBoxActive">
      <template #title>{{ dialog.title }}</template>
      <template #content>{{ dialog.content }}</template>
      <template #actions>
        <md-button @click.prevent="toggleDialogBox">Close</md-button>
      </template>
    </dialog-box>
    <div class="md-layout md-alignment-top-center">
      <h1 class="visualize_header-h1 md-layout-item md-size-100 md-xsmall-size-100">Submit your XML or Excel Spreadsheet</h1>
      <h4 class="md-layout-item md-size-66 md-xsmall-size-100">Instructions:</h4>
      <ol class="md-layout-item md-size-66 md-xsmall-size-100">
        <li>Specify a <b>dataset</b> (below) for which you want to upload Curated Data. If you want to submit data for a
          new paper, you should create a new dataset. For more info on creating a dataset, see the <a
            :href="`${baseUrl}explorer`" target="_blank">EXPLORER</a> page, where you can click the "Add" button to get
          a walkthrough.
        </li>
        <li>Upload your <b>Excel Spreadsheet</b> in the template downloaded from EXCEL TEMPLATE below, then click SUBMIT.
          Note: you must fill in at least one <strong>required field</strong> for the type of data you intend to upload.
        </li>
        <li>XML Templates (optional): The template(s) will be updated shortly. However, you can still submit your XML
          files until the updated templates are released.
        </li>
        <li>Feel free to also upload <b>Supplementary Files</b> (images or documents) which can be helpful to understand
          your sample and process. <i>All</i> uploaded files will be included in your submission email.</li>
      </ol>
    </div>
    <div class="md-layout md-alignment-top-center">
      <h4 class="md-layout-item md-size-66 md-xsmall-size-100">Example File</h4>
      <div class="md-layout-item md-size-66 md-xsmall-size-100">
        <p style="margin-left: 5%">
          You can download our filled sample
          <a href="/nmstatic/curation_template_example.xlsx">here</a>.
        </p>
      </div>
      <h4 class="md-layout-item md-size-66 md-xsmall-size-100">Excel Template</h4>
      <div class="md-layout-item md-size-66 md-xsmall-size-100">
        <p style="margin-left: 5%">
          You can download the current Excel template
          <a href="/nmstatic/curation_template.xlsx">here</a>.
        </p>
      </div>
      <h4 class="md-layout-item md-size-66 md-xsmall-size-100">XML Templates</h4>
      <div class="md-layout-item md-size-66 md-xsmall-size-100">
        <p style="margin-left: 5%">
          You can download the current XML templates
          <a href="/nmstatic/PolymerNanocomposite_Master_Template.zip">here</a>.
        </p>
      </div>
    </div>

    <div>
      <div class="md-layout md-alignment-top-center">
        <dataset-viewer v-if="isAuth" :dataset-options="datasetOptions" :selected-handler="setDatasetId"
          class="md-layout-item md-size-66 md-xsmall-size-100" />
      </div>

      <div class="md-layout md-alignment-top-center">
        <div class="md-layout-item md-size-66 md-xsmall-size-100">
          <h4>Upload your Excel Template (Required):</h4>
          <md-button class="md-primary md-raised" @click="pickTemplate">Browse</md-button>
          <input type="file" style="display: none" accept=".xml,.xlsx,.xls" ref="myTemplate" @change="onTemplatePicked" />
          <md-list v-model="templateName" subheader="true" v-if="templateUploaded">
            <md-list-item :key="templateName">
              <md-icon class="md-primary">check_circle_outline</md-icon>
              <span class="md-list-item-text" v-text="templateName"></span>
            </md-list-item>
          </md-list>
        </div>
      </div>

      <div class="md-layout md-alignment-top-center">
        <div class="md-layout-item md-size-66 md-xsmall-size-100">
          <h4>Upload Supplementary Files (Optional):</h4>
          <md-button class="md-primary md-raised" @click="pickFiles">Browse</md-button>
          <input type="file" style="display: none" ref="myFiles" @change="onFilesPicked" accept="image/*,application/pdf"
            multiple />
          <md-list v-model="fileNames" subheader="true" v-if="filesUploaded">
            <md-list-item v-for="(fileName, idx) in fileNames" :key="idx">
              <md-icon class="md-primary">check_circle_outline</md-icon>
              <span class="md-list-item-text" v-text="fileName"></span>
            </md-list-item>
          </md-list>
        </div>
      </div>

      <div class="md-layout md-alignment-center">
        <div class="md-layout-item md-size-66 md-xsmall-size-100">
          <md-button class="md-primary md-raised" @click="submit()">
            Submit
          </md-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { JobMgr } from '@/modules/JobMgr';
import Dialog from '@/components/Dialog.vue';
import DatasetViewer from '@/components/nanomine/DatasetViewer.vue';

defineOptions({
  name: 'XmlUploader',
});

interface FileTemplate {
  fileName: string;
  fileUrl: string;
}

interface DialogState {
  title: string;
  content: string;
}

interface DatasetOptions {
  mineOnly: 'always';
}

const store = useStore();

// Refs
const myTemplate = ref<HTMLInputElement | null>(null);
const myFiles = ref<HTMLInputElement | null>(null);
const templateName = ref<string>('');
const templateUrl = ref<string>('');
const template = ref<FileTemplate | null>(null);
const templateUploaded = ref<boolean>(false);
const fileNames = ref<string[]>([]);
const files = ref<FileTemplate[]>([]);
const filesUploaded = ref<boolean>(false);
const datasetId = ref<string | null>(null);
const jobId = ref<string>('');
const dialog = ref<DialogState>({
  title: '',
  content: ''
});

const datasetOptions = ref<DatasetOptions>({
  mineOnly: 'always'
});

// Computed
const isAuth = computed<boolean>(() => store.getters['auth/isAuthenticated']);
const dialogBoxActive = computed<boolean>(() => store.getters.dialogBox);
const baseUrl = computed<string>(() => `${window.location.origin}/nm/`);

// Methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const setLoading = (): void => {
  store.commit('isLoading');
};

const resetLoading = (): void => {
  store.commit('notLoading');
};

const pickTemplate = (): void => {
  myTemplate.value?.click();
};

const pickFiles = (): void => {
  myFiles.value?.click();
};

const resetTemplate = (): void => {
  templateName.value = '';
  templateUrl.value = '';
  template.value = null;
  templateUploaded.value = false;
};

const resetFiles = (): void => {
  fileNames.value = [];
  files.value = [];
  filesUploaded.value = false;
};

const onTemplatePicked = (e: Event): void => {
  resetTemplate();
  const target = e.target as HTMLInputElement;
  const uploadedFiles = target.files;
  const file: FileTemplate = {} as FileTemplate;
  const f = uploadedFiles?.[0];
  if (f !== undefined) {
    templateName.value = f.name;
    file.fileName = templateName.value;
    const fr = new FileReader();
    fr.readAsDataURL(f);
    fr.addEventListener('load', () => {
      templateUrl.value = fr.result as string;
      file.fileUrl = templateUrl.value;
      template.value = file;
      templateUploaded.value = true;
    });
  } else {
    resetTemplate();
  }
};

const onFilesPicked = (e: Event): void => {
  resetFiles();
  const target = e.target as HTMLInputElement;
  const uploadedFiles = target.files;
  if (uploadedFiles && uploadedFiles.length > 0) {
    Array.from(uploadedFiles).forEach((f) => {
      const file: FileTemplate = {} as FileTemplate;
      file.fileName = f.name;
      fileNames.value.push(f.name);
      const fr = new FileReader();
      fr.readAsDataURL(f);
      fr.addEventListener('load', () => {
        file.fileUrl = fr.result as string;
        files.value.push(file);
      });
    });
    filesUploaded.value = true;
  } else {
    resetFiles();
  }
};

const setDatasetId = (dataset: any): void => {
  if (dataset && dataset._id) {
    datasetId.value = dataset._id;
  } else {
    datasetId.value = null;
  }
};

const renderDialog = (title: string, content: string): void => {
  dialog.value = {
    title,
    content
  };
  toggleDialogBox();
};

const submit = (): void => {
  if (template.value == null) {
    renderDialog('Upload Error', 'Please select an Excel Template or XML file to upload.');
    return;
  }
  if (!isAuth.value) {
    renderDialog('Authorization Error', 'You must be logged in to submit data.');
    return;
  }
  if (!datasetId.value) {
    renderDialog('Dataset Error', 'Please select a dataset.');
    return;
  }
  setLoading();
  if (template.value != null) {
    files.value.unshift(template.value);
  }
  const jm = new JobMgr();
  jm.setJobType('xmlconv');
  jm.setJobParameters({
    datasetId: datasetId.value,
    templateName: templateName.value
  });
  files.value.forEach(function (v) {
    jm.addInputFile(v.fileName, v.fileUrl);
  });
  return jm.submitJob(
    (jobIdResult: string) => {
      jobId.value = jobIdResult;
      resetLoading();
      renderDialog(
        'XML Conversion Job Submitted Successfully',
        `Your uploader job is: ${jobIdResult}. You should receive an email with a link to the job output.`
      );
      resetTemplate();
      resetFiles();
    },
    (errCode: number, errMsg: string) => {
      renderDialog(
        'Error Submitting Files for Upload',
        `error code: ${errCode}\nmessage: ${errMsg}`
      );
      resetLoading();
    }
  );
};

// Lifecycle
onMounted(() => {
  store.commit('setAppHeaderInfo', {
    icon: 'cloud_upload',
    name: 'Curate Data'
  });
});
</script>

<style scoped>
img {
  width: 240px;
}

h4 {
  text-transform: uppercase;
}
</style>
