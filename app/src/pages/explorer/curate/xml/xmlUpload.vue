<template>
  <div class="section_teams">
    <div>
      <CurateNavBar active="New XML Upload" :navRoutes="navRoutes" />
    </div>
    <div class="curate">
      <LoginReq v-if="!isAuth" />
      <div v-else-if="loading" class="section_loader">
        <spinner :text="uploadInProgress" />
      </div>
      <div v-else-if="submitted" class="section_loader">
        <h2 class="visualize_header-h1">XML Samples Submitted</h2>
      </div>
      <div v-else>
        <h2 class="visualize_header-h1">Upload XML Samples</h2>
        <md-steppers md-vertical md-linear :md-active-step.sync="active" class="form__stepper">
          <md-step id="first" md-label="Upload Xml File" :md-done.sync="first">
            <DropZone class="form__drop-area" @files-dropped="addXmlFile">
              <label for="xml-file-input">
                <div class="form__drop-area_label">
                  <div class="explorer_page-nav-card_text">Drag prepared xml files here</div>
                  <div
                    class="md-layout-item_para md-layout-item_para_fl"
                    style="text-align: center"
                  >
                    or click to browse. Accepts .xml files
                  </div>
                  <input
                    type="file"
                    id="xml-file-input"
                    multiple
                    @change="onInputChange"
                    accept=".xml"
                  />
                </div>
              </label>
            </DropZone>
            <div class="u--margin-posmd u--color-primary teams_header">
              <strong>Note:</strong> Title, Author, Citation Type and Publication Year, are
              required entry in the XML.
            </div>
            <div class="md-layout" v-show="xmlFiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview
                  v-for="file in xmlFiles"
                  :key="file.id"
                  :file="file"
                  tag="div"
                  classname="md-layout-item"
                  @remove="removeXmlFile"
                />
              </md-list>
            </div>
            <md-button
              type="submit"
              :disabled="xmlFiles.length < 1"
              class="md-button_next u--margin-toplg"
              @click="goToStep('first', 'second')"
            >
              Next
            </md-button>
          </md-step>
          <md-step id="second" md-label="Confirm and submit" :md-done.sync="second">
            <div class="u--color-primary teams_header">
              <strong>Are you sure?</strong> Select
              <strong>Save & Submit</strong> to confirm or
              <strong>Go Back</strong> to cancel
            </div>
            <div class="md-layout">
              <md-button
                type="submit"
                class="md-layout-item md-button_prev md-size-40"
                @click="goToStep('second', 'first')"
              >
                <md-icon>arrow_back</md-icon>Go Back
              </md-button>
              <md-button
                id="submit"
                type="submit"
                :disabled="xmlFiles.length < 1"
                class="md-layout-item md-button_next md-size-40"
                @click="submitXmlFiles"
              >
                Save and Submit
              </md-button>
            </div>
          </md-step>
        </md-steppers>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import DropZone from '@/components/curate/FileDrop.vue';
import FilePreview from '@/components/curate/FilePreview.vue';
import LoginRequired from '@/components/LoginRequired.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import Spinner from '@/components/Spinner.vue';
import useFileList from '@/modules/file-list';

// Component name for debugging
defineOptions({
  name: 'XmlUpload',
});

// Store
const store = useStore();

// File list composable
const xmlFilesFn = useFileList();

// Reactive data
interface NavRoute {
  label: string;
  path: string;
}

const active = ref('first');
const first = ref(false);
const second = ref(false);
const xmlFiles = xmlFilesFn.files;
const loading = ref(false);
const uploadInProgress = ref<string | null>(null);
const submitted = ref(false);
const navRoutes = ref<NavRoute[]>([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
]);

// Computed
const isAuth = computed(() => store.getters['auth/isAuthenticated']);

// Methods
const addXmlFile = xmlFilesFn.addFiles;
const removeXmlFile = (file: any) => xmlFilesFn.removeFile(file);
const modStatXml = xmlFilesFn.modifyStatus;

const goToStep = (id: string, index?: string) => {
  if (id === 'first') first.value = true;
  if (id === 'second') second.value = true;
  if (index) {
    active.value = index;
  }
};

const filterXml = (files: FileList | File[]) => {
  const newFiles = [...files];
  const filteredFiles: File[] = [];
  const regex = /.xml$/gi;
  for (let i = 0; i < newFiles.length; i++) {
    if (regex.test(newFiles[i].name)) {
      filteredFiles.push(newFiles[i]);
    }
  }
  return filteredFiles;
};

const onInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.id === 'xml-file-input' && target.files) {
    const uploadedXmlFiles = filterXml(target.files);
    addXmlFile(uploadedXmlFiles);
  }
  // reset so that selecting the same file again will still cause it to fire this change
  target.value = '';
};

const submitXmlFiles = async () => {
  uploadInProgress.value = 'Uploading...';
  loading.value = true;
  await store.dispatch('explorer/curation/submitXmlFiles', xmlFiles.value);
  loading.value = false;
  submitted.value = true;
  uploadInProgress.value = null;
};
</script>
