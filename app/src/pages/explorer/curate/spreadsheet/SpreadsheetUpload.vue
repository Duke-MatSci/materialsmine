<template>
  <div>
    <div>
      <div class="section_teams">
        <div>
          <CurateNavBar active="New Spreadsheet" :navRoutes="navRoutes" />
        </div>
        <div class="curate">
          <LoginReq v-if="!auth" />
          <div v-else-if="!!uploadResponse">
            <h2 class="visualize_header-h1 u_margin-top-small u_centralize_text">Curated XML</h2>
            <hr />
            <div class="md-layout">
              <div class="md-layout-item md-size-50">
                <div>Dataset Group ID: {{ uploadResponse.groupId }}</div>
                <div>Curated by {{ optionalChaining(() => uploadResponse.user.displayName) }}</div>
              </div>
              <div class="md-layout-item md-size-50" style="text-align: right">
                <div>Status: {{ uploadResponse.status }}</div>
                <div>Admin Approval: {{ uploadResponse.isApproved ? 'Approved' : 'None' }}</div>
              </div>
            </div>
            <XmlView :xml="optionalChaining(() => uploadResponse.xml)" />
          </div>
          <div v-else>
            <h2 class="visualize_header-h1">Curate single sample</h2>
            <div
              v-if="datasetId"
              class="md-layout md-alignment-center-left"
              style="margin: 0rem 1rem"
            >
              <span>
                Uploading to dataset ID
                <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">{{ datasetId }}</a>
              </span>
              <md-button
                id="editId"
                class="md-icon-button"
                @click="renderDialog('Use a different ID?', 'datasetId', 80)"
              >
                <md-icon>edit</md-icon>
              </md-button>
            </div>
            <div v-else>
              No dataset ID selected.
              <a @click="renderDialog('Use a different ID?', 'datasetId', 80)"
                >Select an existing ID</a
              >
              , or return to the <a @click="navBack">previous page?</a>
            </div>
            <md-steppers
              md-vertical
              md-linear
              v-model:md-active-step="active"
              class="form__stepper"
            >
              <md-step id="first" md-label="Download blank template" v-model:md-done="first">
                <div class="utility-line-height-sm">
                  <a href="/master_template.xlsx" download> Click here</a> to download the template
                  spreadsheet, and fill it out with your data.
                </div>
                <div class="utility-line-height-sm">
                  To curate FEA data, <a>click here</a> instead.
                </div>

                <div class="utility-line-height-sm">
                  Skip this step if you have already downloaded the template spreadsheet.
                </div>
                <md-button
                  type="submit"
                  class="md-button_next u--margin-toplg"
                  @click="goToStep('first', 'second')"
                >
                  Next
                </md-button>
              </md-step>
              <md-step
                id="second"
                md-label="Select spreadsheet for upload"
                v-model:md-done="second"
              >
                <DropZone class="form__drop-area" @files-dropped="addSpreadsheet">
                  <label for="file-spreadsheet-input">
                    <div class="form__drop-area_label">
                      <div class="explorer_page-nav-card_text">
                        Drag the completed spreadsheet here
                      </div>
                      <div
                        class="md-layout-item_para md-layout-item_para_fl"
                        style="text-align: center"
                      >
                        or click to browse. Accepts .xlsx
                      </div>
                      <input
                        type="file"
                        id="file-spreadsheet-input"
                        multiple
                        @change="onInputChange"
                        accept=".xlsx"
                      />
                    </div>
                  </label>
                </DropZone>
                <div class="u--margin-posmd u--color-primary teams_header">
                  <strong>Note:</strong> Title, Author, Citation Type and Publication Year, are
                  required entry in the master template.
                </div>
                <div class="md-layout" v-show="spreadsheetFiles.length">
                  <md-list class="md-layout utility-transparentbg md-theme-default">
                    <FilePreview
                      v-for="file in spreadsheetFiles"
                      :key="file.id"
                      :file="file"
                      tag="div"
                      classname="md-layout-item"
                      @remove="(file: any) => removeSpreadsheet(file)"
                    />
                  </md-list>
                </div>
                <div style="color: red; margin: 2rem 2rem 0; font-weight: 600" v-if="renameXlsx">
                  NOTICE: Main spreadsheet name must end with 'master_template.xlsx'. Please rename
                  this file and re-select.
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
                    type="submit"
                    :disabled="spreadsheetFiles.length < 1"
                    class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('second', 'third')"
                  >
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
              </md-step>
              <md-step
                id="third"
                md-label="Select supplementary files for upload"
                v-model:md-done="third"
              >
                <DropZone class="form__drop-area" @files-dropped="addSupp">
                  <label for="file-supp-input">
                    <div class="form__drop-area_label">
                      <div class="explorer_page-nav-card_text">
                        Add supplementary images and raw data files here
                      </div>
                      <div
                        class="md-layout-item_para md-layout-item_para_fl"
                        style="text-align: center"
                      >
                        or click to browse.
                      </div>
                      <input
                        type="file"
                        id="file-supp-input"
                        multiple
                        @change="onInputChange"
                        accept=".jpg, .jpeg, .png, .csv, .xls, .tif, .tiff"
                      />
                    </div>
                  </label>
                </DropZone>

                <div class="md-layout" v-show="suppFiles.length">
                  <md-list class="md-layout utility-transparentbg md-theme-default">
                    <FilePreview
                      v-for="file in suppFiles"
                      :key="file.id"
                      :file="file"
                      tag="div"
                      classname="md-layout-item"
                      @remove="(file: any) => removeSupp(file)"
                    />
                  </md-list>
                </div>
                <!--TODO:  Need to convert tif files, redirect to converter (add step) and allow to download-->
                <div style="color: red; margin: 2rem 2rem 0; font-weight: 600" v-if="newTifs">
                  NOTICE: One or more of your selected files was .tif/.tiff. We recommend converting
                  this file to .png or .jpg/.jpeg and re-selecting.
                </div>

                <div class="md-layout">
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('third', 'second')"
                  >
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('third', 'fourth')"
                  >
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
              </md-step>
              <md-step id="fourth" md-label="Additional Information" v-model:md-done="fourth">
                <div
                  v-if="datasetId"
                  class="md-layout md-alignment-center-left"
                  style="margin: 0rem 1rem"
                >
                  <span>
                    Uploading to dataset ID
                    <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">{{
                      datasetId
                    }}</a>
                  </span>
                  <md-button
                    id="editId"
                    class="md-icon-button"
                    @click="renderDialog('Use a different ID?', 'datasetId', 80)"
                  >
                    <md-icon>edit</md-icon>
                  </md-button>
                </div>
                <div v-else>
                  No dataset ID selected.
                  <a @click="renderDialog('Use a different ID?', 'datasetId', 80)"
                    >Select an existing ID</a
                  >
                  , or <a @click="navBack">exit the form?</a>
                </div>
                <md-field style="max-width: 80%; margin: 1rem">
                  <label>DOI</label>
                  <md-input v-model="doi"></md-input>
                  <span class="md-helper-text"
                    >Enter the DOI of related publication if exists (e.g., 10.1000/000)</span
                  >
                </md-field>
                <div class="md-layout u--margin-toplg">
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('fourth', 'third')"
                  >
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('fourth', 'fifth')"
                  >
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
              </md-step>
              <md-step id="fifth" md-label="Verify data" v-model:md-done="fifth">
                <h3>DOI:</h3>
                {{ doi }}
                <div>&nbsp;</div>
                <h3>Uploaded files:</h3>

                <h4 style="margin-top: 1rem">Spreadsheet(s)</h4>
                <ul style="margin-left: 1rem">
                  <div v-for="(ss, index) in spreadsheetFiles" :key="index">
                    {{ ss.file.name }}
                  </div>
                </ul>

                <h4 style="margin-top: 1rem">Supplementary files</h4>
                <ul style="margin-left: 1rem">
                  <div v-for="(suppl, index) in suppFiles" :key="index">
                    {{ suppl.file.name }}
                  </div>
                </ul>

                <div style="color: red; margin-top: 2rem" v-if="spreadsheetFiles.length < 1">
                  At least one spreadsheet is required for submission.
                </div>
                <div class="md-layout">
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('fifth', 'fourth')"
                  >
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('fifth', 'sixth')"
                  >
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
              </md-step>
              <md-step id="sixth" md-label="Confirm and submit">
                <div class="md-layout">
                  <md-button
                    type="submit"
                    class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('sixth', 'fifth')"
                  >
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button
                    id="submit"
                    type="submit"
                    :disabled="spreadsheetFiles.length < 1"
                    class="md-layout-item md-button_next md-size-40"
                    @click="
                      renderDialog('Submit files?', 'submit', 40);
                      clearSnackbar();
                    "
                  >
                    Save and Submit
                  </md-button>
                </div>
              </md-step>
            </md-steppers>
          </div>
        </div>
      </div>
      <Dialog
        :active="dialogBoxActive"
        :minWidth="dialog.minWidth"
        :disableClose="dialog.disableClose"
      >
        <template v-slot:title>{{ dialog.title }}</template>
        <template v-slot:content>
          <div v-if="dialog.type == 'submit'">
            You are submitting {{ spreadsheetFiles.length }} spreadsheet<span
              v-if="spreadsheetFiles.length != 1"
              >s</span
            >
            and {{ suppFiles.length }} supplementary file<span v-if="suppFiles.length != 1">s</span
            >.
          </div>
          <div v-if="dialog.type == 'datasetId'">
            <div v-if="datasetId">
              You are using dataset ID <b>{{ datasetId }}</b
              >.
            </div>
            <div>To use a pre-existing ID, select from the following:</div>
            <md-autocomplete
              v-model="selectedDataset.label"
              @md-selected="changeSelectedDataset"
              :md-options="getUserDataset.datasets"
              :md-open-on-focus="true"
            >
              <label>Dataset ID</label>
              <template v-slot:md-autocomplete-item="{ item }">
                <div style="width: 100%">
                  <div
                    style="
                      width: 90%;
                      overflow: hidden;
                      -o-text-overflow: ellipsis;
                      text-overflow: ellipsis;
                    "
                  >
                    <b>{{ item.title || `${item.datasetGroupId} (Untitled)` }} &nbsp;</b>
                  </div>
                  <span>
                    <i>last updated {{ new Date(parseInt(item.updatedAt)).toLocaleString() }}</i>
                  </span>
                </div>
              </template>

              <template v-slot:md-autocomplete-empty="{ term }">
                <p>No dataset IDs matching "{{ term }}" were found.</p>
              </template>
            </md-autocomplete>
          </div>
          <div v-if="dialog.type == 'loading' && uploadInProgress">
            <Spinner
              :text="typeof uploadInProgress === 'string' ? uploadInProgress : 'Loading...'"
            />
          </div>
        </template>
        <template v-slot:actions>
          <div v-if="dialog.type == 'datasetId'">
            <div class="">
              <md-button type="submit" class="md-button-transparent" @click="toggleDialogBox()">
                Cancel
              </md-button>
              <md-button
                type="submit"
                class="md-button-transparent"
                @click="
                  toggleDialogBox();
                  changeDatasetId();
                "
              >
                Confirm dataset ID change
              </md-button>
            </div>
          </div>
          <div v-else-if="dialog.type == 'submit'">
            <md-button type="submit" class="md-button-transparent" @click="toggleDialogBox()">
              No, continue editing
            </md-button>
            <md-button
              id="confirmSubmit"
              type="submit"
              class="md-button-transparent"
              @click="submitFiles()"
            >
              Yes, submit
            </md-button>
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import DropZone from '@/components/curate/FileDrop.vue';
import FilePreview from '@/components/curate/FilePreview.vue';
import LoginRequired from '@/components/LoginRequired.vue';
import Dialog from '@/components/Dialog.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import Spinner from '@/components/Spinner.vue';
import XmlView from '@/components/explorer/XmlView.vue';
import useFileList from '@/modules/file-list';
import { useOptionalChaining } from '@/composables/useOptionalChaining';
import { VERIFY_AUTH_QUERY, USER_DATASET_IDS_QUERY } from '@/modules/gql/dataset-gql';

// Component name for debugging
defineOptions({
  name: 'SpreadsheetHome',
});

// Props
interface Props {
  datasetId: string;
}

const props = defineProps<Props>();

// Store and router
const store = useStore();
const router = useRouter();

// Composables
const { optionalChaining } = useOptionalChaining();

// Create separate file objects for spreadsheet vs supplementary files
const spreadsheetFn = useFileList();
const suppFn = useFileList();

// Reactive data
const auth = ref(true);
const verifyUser = ref<any>(null);
const uploadInProgress = ref<string | boolean>(true);
const uploadResponse = ref<any>(null);
const selectedDataset = ref({
  label: '',
  id: null as string | null,
});
const tifFiles = ref<File[]>([]);
const newTifs = ref(false);
const renameXlsx = ref(false);
const spreadsheetFiles = spreadsheetFn.files;
const suppFiles = suppFn.files;
const doi = ref<string | null>(null);
const active = ref('first');
const first = ref(false);
const second = ref(false);
const third = ref(false);
const fourth = ref(false);
const fifth = ref(false);
const sixth = ref(false);
const dialog = ref({
  title: '',
  type: null as string | null,
  size: 60,
  minWidth: 60,
  disableClose: false,
});
const navRoutes = ref([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
  {
    label: 'Spreadsheet',
    path: '/explorer/curate/spreadsheet',
  },
]);

// Computed properties
const userId = computed(() => store.getters['auth/userId']);
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const dialogBoxActive = computed(() => store.getters['dialogBox']);
const token = computed(() => store.getters['auth/token']);

// GraphQL queries
const { result: verifyUserResult } = useQuery(
  VERIFY_AUTH_QUERY,
  () => ({}),
  () => ({
    fetchPolicy: 'cache-and-network',
  })
);

const { result: getUserDatasetResult } = useQuery(
  USER_DATASET_IDS_QUERY,
  () => ({}),
  () => ({
    fetchPolicy: 'cache-and-network',
  })
);

// Watch for query results
watch(verifyUserResult, (newResult) => {
  if (newResult?.verifyUser) {
    verifyUser.value = newResult.verifyUser;
  }
});

const getUserDataset = ref<any>({ datasets: [] });

watch(getUserDatasetResult, (newResult) => {
  if (newResult?.getUserDataset) {
    getUserDataset.value = newResult.getUserDataset;
  }
});

// Methods
const addSpreadsheet = spreadsheetFn.addFiles;
const removeSpreadsheet = spreadsheetFn.removeFile;
const modStatSpreadsheet = spreadsheetFn.modifyStatus;
const addSupp = suppFn.addFiles;
const removeSupp = suppFn.removeFile;
const modStatSupp = suppFn.modifyStatus;

const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const clearSnackbar = () => {
  store.commit('resetSnackbar');
};

const navBack = () => {
  router.back();
};

// Format files for submission
const processFiles = () => {
  return spreadsheetFiles.value
    .filter((file: any) => file.status === 'incomplete')
    .concat(suppFiles.value.filter((file: any) => file.status === 'incomplete'))
    .map(({ file }: any) => file);
};

const onInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.id === 'file-spreadsheet-input') {
    const filteredXlsx = filterXlsx(target.files);
    addSpreadsheet(filteredXlsx);
  } else {
    filterTif(target.files);
    if (target.files) {
      addSupp(target.files);
    }
  }
  // reset so that selecting the same file again will still cause it to fire this change
  target.value = '';
};

const filterXlsx = (files: FileList | null) => {
  if (!files) return [];
  renameXlsx.value = false;
  const newFiles = [...files];
  const filteredFiles: File[] = [];
  const regex = /master_template.xlsx$/gi;
  for (let i = 0; i < newFiles.length; i++) {
    if (!regex.test(newFiles[i].name)) {
      renameXlsx.value = true;
    } else filteredFiles.push(newFiles[i]);
  }
  return filteredFiles;
};

const filterTif = (files: FileList | null) => {
  if (!files) return [];
  newTifs.value = false;
  const newFiles = [...files];
  const filteredFiles: File[] = [];
  for (let i = 0; i < newFiles.length; i++) {
    if (newFiles[i].type.includes('tif')) {
      tifFiles.value.push(newFiles[i]);
      newTifs.value = true;
    } else filteredFiles.push(newFiles[i]);
  }
  return filteredFiles;
};

const goToStep = (id: string, index?: string) => {
  clearSnackbar();
  (this as any)[id] = true;
  if (index) {
    active.value = index;
  }
};

const submitFiles = async () => {
  uploadInProgress.value = 'Uploading files';
  renderDialog('Submitting dataset', 'loading', 40, true);
  try {
    await createSample();
  } catch (error: any) {
    toggleDialogBox();
    store.commit('setSnackbar', {
      message: error ?? error,
    });
  }
};

const renderDialog = (title: string, type: string, minWidth: number, disableClose = false) => {
  dialog.value = {
    title,
    type,
    size: 60,
    minWidth,
    disableClose,
  };
  toggleDialogBox();
};

const createSample = async () => {
  toggleDialogBox();
  const url = `${window.location.origin}/api/curate/?dataset=${props.datasetId}`;
  const formData = new FormData();
  const files = processFiles();
  files.forEach((file) => formData.append('uploadfile', file));
  formData.append('doi', doi.value || '');
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    redirect: 'follow',
    headers: {
      Authorization: 'Bearer ' + token.value,
    },
  });
  uploadInProgress.value = 'Processing spreadsheet';

  const result = await response.json();
  if (response?.ok) {
    spreadsheetFiles.value.forEach((file: any, index: number) =>
      modStatSpreadsheet(index, 'complete')
    );
    suppFiles.value.forEach((file: any, index: number) => modStatSupp(index, 'complete'));
    uploadInProgress.value = false;
    uploadResponse.value = result;
    return toggleDialogBox();
  }
  const responseMessage =
    result.message ??
    Object.entries(result?.errors).reduce(
      (str: string, [key, value]: [string, any], index: number) => {
        return index === 0 ? `${str}${key} ${value}` : `${str}, ${key} ${value}`;
      },
      ''
    );
  const message = responseMessage ?? response?.statusText;
  throw new Error(message);
};

const changeSelectedDataset = (selection: any) => {
  selectedDataset.value.label = selection.title || `${selection.datasetGroupId} (Untitled)`;
  selectedDataset.value.id = selection.datasetGroupId;
};

const changeDatasetId = () => {
  router.replace({ name: 'CurateSpreadsheet', params: { datasetId: selectedDataset.value.id } });
};
</script>
