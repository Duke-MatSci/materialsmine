<template>
  <div>
    <div>
      <div>
        <CurateNavBar
          :active="`Direct Upload with SDD > ${generatedUUID}`"
          :navRoutes="navRoutes"
        />
      </div>
      <div class="curate">
        <div>
          <div class="section_loader" v-if="loading">
            <spinner :loading="loading" text="Loading Dataset" />
          </div>
          <div v-else @click="disableDropdownRender">
            <md-card style="margin: 10px">
              <form
                class="modal-content"
                action=""
                method="post"
                enctype="multipart/form-data"
                upload_type="http://www.w3.org/ns/dcat#Dataset"
              >
                <md-steppers class="form__stepper" v-model:md-active-step="active" md-linear>
                  <md-step id="first" md-label="Upload files" :md-error="invalid.first">
                    <div style="margin: 20px">
                      <md-field style="max-width: 100%">
                        <label>DOI of related publication (e.g., 10.1000/000)</label>
                        <md-input v-model="doi" @change="lookupDoi"></md-input>
                      </md-field>

                      <FileInput @files-dropped="addDistr">
                        <label for="file-distr-input">
                          <div class="form__file-input">
                            <div
                              class="md-field md-theme-default md-required md-has-file"
                              :class="{ 'md-invalid': invalid['first'] }"
                            >
                              <md-icon>attach_file</md-icon>
                              <label for="file-distr-input"
                                >Select files to upload for this dataset</label
                              >
                              <div class="md-file" multiple isinvalidvalue="false">
                                <input
                                  type="file"
                                  id="file-distr-input"
                                  multiple
                                  @change="onInputChange"
                                />
                              </div>
                              <span class="md-error" style="margin-left: 40px"
                                >At least one distribution is required</span
                              >
                            </div>
                          </div>
                        </label>
                      </FileInput>

                      <div class="u--margin-posmd" v-show="distrFiles.length">
                        <h4 v-if="oldDistributions.length">New file(s) to upload</h4>
                        <div class="md-layout">
                          <md-list class="md-layout utility-transparentbg md-theme-default">
                            <FilePreview
                              v-for="file in distrFiles"
                              :key="file.id"
                              :file="file"
                              tag="div"
                              classname="md-layout-item"
                              @remove="removeDistr"
                            />
                          </md-list>
                        </div>
                      </div>

                      <md-divider
                        v-if="distrFiles.length && oldDistributions.length"
                        class="u_width--max"
                        style="border-style: solid"
                      ></md-divider>

                      <div class="u--margin-posmd" v-if="oldDistributions.length">
                        <h4>Previously uploaded file(s)</h4>
                        <i>
                          These files are already in MaterialsMine. You do not need to be re-upload
                          them
                        </i>
                        <div class="md-layout">
                          <md-list class="md-layout utility-transparentbg md-theme-default">
                            <div
                              v-for="file in oldDistributions"
                              :key="`${file.uri}_old`"
                              classname="md-layout-item"
                            >
                              <FilePreview
                                :file="file"
                                tag="div"
                                :customActions="true"
                                :showRemove="false"
                              >
                                <template #custom_actions>
                                  <md-button
                                    id="downloadFile"
                                    class="md-icon-button"
                                    :href="file.uri"
                                    download
                                  >
                                    <md-tooltip> Download file </md-tooltip>
                                    <md-icon>download</md-icon>
                                  </md-button>
                                  <md-button
                                    id="deleteFile"
                                    class="md-icon-button"
                                    @click.prevent="confirmDeletion(file)"
                                  >
                                    <md-tooltip> Delete file </md-tooltip>
                                    <md-icon>delete</md-icon>
                                  </md-button>
                                </template>
                              </FilePreview>
                            </div>
                          </md-list>
                        </div>
                      </div>

                      <FileInput @files-dropped="previewFile()">
                        <label for="file-depict-input">
                          <div class="form__file-input">
                            <div class="md-field md-theme-default md-has-file">
                              <md-icon>attach_file</md-icon>
                              <label for="file-depict-input"
                                >Select an image to use as a cover for the dataset (optional)</label
                              >
                              <div class="md-file" multiple isinvalidvalue="false">
                                <input
                                  type="file"
                                  id="file-depict-input"
                                  multiple
                                  @change="previewFile()"
                                  accept="image/*"
                                />
                              </div>
                            </div>
                          </div>
                        </label>
                      </FileInput>

                      <div class="md-layout md-gutter u--margin-posmd">
                        <span>
                          <div
                            class="u--margin-posmd u--margin-rightmd u--margin-leftsm"
                            v-if="oldDepiction"
                          >
                            <h4>Previously uploaded thumbnail</h4>
                            <figure>
                              <img
                                v-if="oldDepiction.accessUrl"
                                :src="oldDepiction.accessUrl"
                                alt="Image preview..."
                                style="height: 150px"
                              />
                              <figcaption v-if="oldDepiction.status === 'delete'">
                                Will be deleted when edits are submitted
                              </figcaption>
                            </figure>
                            <md-button
                              id="downloadFile"
                              class="md-icon-button"
                              :href="oldDepiction.accessUrl"
                              download
                            >
                              <md-tooltip> Download file </md-tooltip>
                              <md-icon>download</md-icon>
                            </md-button>
                            <md-button
                              v-if="oldDepiction.status === 'complete'"
                              id="deleteFile"
                              class="md-icon-button"
                              @click.prevent="oldDepiction.status = 'delete'"
                            >
                              <md-tooltip> Delete file </md-tooltip>
                              <md-icon>delete</md-icon>
                            </md-button>
                            <md-button
                              v-if="oldDepiction.status === 'delete'"
                              id="undoDelete"
                              class="md-icon-button"
                              @click.prevent="oldDepiction.status = 'complete'"
                            >
                              <md-tooltip> Undo Delete </md-tooltip>
                              <md-icon>restore_from_trash</md-icon>
                            </md-button>
                          </div>
                        </span>
                        <span>
                          <div
                            id="depictWrapper"
                            class="u--margin-posmd justify-center"
                            style="visibility: hidden; height: 200px"
                          >
                            <h4 v-if="oldDepiction">
                              Replacement thumbnail<span v-if="depiction"
                                >: {{ depiction.name }}</span
                              >
                            </h4>
                            <figure>
                              <img
                                id="depictImg"
                                src=""
                                alt="Image preview..."
                                style="height: 150px"
                              />
                              <figcaption v-if="oldDepiction">
                                This original thumbnail will be deleted and replaced by this image
                              </figcaption>
                            </figure>
                            <md-button @click="removeImage" type="button" class="close md-raised"
                              >Remove image</md-button
                            >
                          </div>
                        </span>
                      </div>
                    </div>
                    <div class="md-card-actions md-alignment-right chart_editor__right-view">
                      <md-button
                        @click="goToStep('first', 'second')"
                        class="md-theme-default md-button_next"
                      >
                        Next
                      </md-button>
                    </div>
                  </md-step>

                  <md-step
                    id="second"
                    md-label="Provide additional info"
                    :md-error="invalid.second"
                  >
                    <div class="md-layout">
                      <!---------- General Info fields ---------->
                      <md-content class="u_width--max" style="margin: 20px">
                        <div class="md-headline" style="margin-top: 10px">General Information</div>
                        <md-field
                          style="max-width: 100%"
                          :class="{
                            'md-invalid': invalid['second'] && !dataset.title,
                          }"
                        >
                          <label>Title</label>
                          <md-input v-model="dataset.title" required></md-input>
                          <span class="md-error">Title required</span>
                        </md-field>

                        <div class="md-subheading" style="margin-top: 40px">Contact Point</div>
                        <div class="md-layout md-gutter" style="align-items: center">
                          <div
                            class="md-layout-item md-size-30 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med"
                          >
                            <md-field
                              :class="{
                                'md-invalid':
                                  (invalid['second'] && !dataset.contactPoint['@id']) ||
                                  invalid.orcid,
                              }"
                            >
                              <label style="font-size: 14px"
                                >ORCID Identifier (e.g., 0000-0001-2345-6789)</label
                              >
                              <md-input v-model="orcidId" required @change="lookupOrcid"></md-input>
                              <span class="md-error" v-if="!invalid.orcid">ORCID ID required</span>
                              <span class="md-error" v-if="invalid.orcid">Invalid ORCID ID</span>
                            </md-field>
                          </div>

                          <div
                            class="md-layout-item md-size-25 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med"
                          >
                            <md-field
                              :class="{
                                'md-invalid': invalid['second'] && !dataset.contactPoint.cpEmail,
                              }"
                              class="u_width--max"
                            >
                              <label>Email</label>
                              <md-input v-model="dataset.contactPoint.cpEmail" required></md-input>
                              <span class="md-error">Valid email required</span>
                            </md-field>
                          </div>

                          <div
                            class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med"
                          >
                            <md-field
                              :class="{
                                'md-invalid': invalid['second'] && !dataset.contactPoint.firstName,
                              }"
                            >
                              <label>First name</label>
                              <md-input
                                v-model="dataset.contactPoint.firstName"
                                required
                              ></md-input>
                              <span class="md-error">Contact point required</span>
                            </md-field>
                          </div>

                          <div
                            class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med"
                          >
                            <md-field
                              :class="{
                                'md-invalid': invalid['second'] && !dataset.contactPoint.lastName,
                              }"
                            >
                              <label>Last name</label>
                              <md-input v-model="dataset.contactPoint.lastName" required></md-input>
                              <span class="md-error">Contact point required</span>
                            </md-field>
                          </div>
                        </div>

                        <div style="margin: 40px; text-align: center">
                          Don't have an ORCID iD?
                          <a href="https://orcid.org/" target="_blank">Create one here</a>
                        </div>

                        <md-field
                          class="u_width--max"
                          :class="{
                            'md-invalid': invalid['second'] && !dataset.description,
                          }"
                        >
                          <label>Text Description</label>
                          <md-textarea v-model="dataset.description" required></md-textarea>
                          <span class="md-error">Description required</span>
                        </md-field>

                        <div>
                          <label>Associated Organization (e.g., name of university)</label>
                          <div>
                            <md-chip
                              md-deletable
                              class="u_margin-bottom-small"
                              v-for="(element, i) in dataset.organization"
                              @md-delete="deleteOrg(dataset.organization, i)"
                              :key="`org_${i}`"
                              >{{ element.name }}
                            </md-chip>
                          </div>
                          <md-field md-dense class="u--margin-none">
                            <md-input
                              v-model="searchKeywordOrg"
                              name="searchKeywordOrg"
                              id="searchKeywordOrg"
                              placeholder="Search Organizations"
                            ></md-input>
                            <md-icon>search</md-icon>
                          </md-field>
                          <template v-if="!!organizations.length && showDropdown">
                            <ul class="search-dropdown-menu-plain" :style="setDropdownPosition()">
                              <li
                                v-for="(item, index) in organizations"
                                :key="index"
                                @click.prevent="selectOrg(item)"
                              >
                                <span>
                                  {{ item.name }}
                                  <span
                                    v-if="item.addresses?.[0]?.city || item.country?.country_code"
                                  >
                                    ({{ item.addresses?.[0]?.city }},
                                    {{ item.country?.country_code }})
                                  </span>
                                </span>
                              </li>
                            </ul>
                          </template>
                        </div>
                      </md-content>

                      <!-- -------- Publication Info fields -------- -->
                      <md-content class="u_width--max" style="margin: 20px">
                        <div class="u_width--max">
                          <div class="md-layout md-gutter">
                            <div class="md-layout-item md-size-50">
                              <label>Date Published</label>
                              <md-field>
                                <md-input
                                  v-model="dataset.datePub['@value']"
                                  type="date"
                                ></md-input>
                              </md-field>
                            </div>
                          </div>
                        </div>
                      </md-content>

                      <md-card-actions
                        class="u_width--max u_height--max"
                        style="margin: 20px; padding-top: 5rem"
                      >
                        <div class="md-layout md-gutter">
                          <div class="md-layout-item md-size-10 md-xsmall-size-35">
                            <md-button
                              @click="goToStep('second', 'first')"
                              class="md-theme-default md-button_prev"
                            >
                              Previous
                            </md-button>
                          </div>
                          <div
                            class="md-layout-item md-size-80 md-small-size-70 md-xsmall-size-30"
                          ></div>
                          <div class="md-layout-item md-size-10 md-small-size-20 md-xsmall-size-35">
                            <md-button
                              @click="goToStep('second', 'third')"
                              class="md-theme-default md-button_next"
                            >
                              Next
                            </md-button>
                          </div>
                        </div>
                      </md-card-actions>
                      <div class="u_width--max u_height--max">
                        <div
                          v-if="invalid['second'] && !secondPageFilled"
                          class="md-error"
                          style="color: red; text-align: right"
                        >
                          Check for errors in required fields
                        </div>
                      </div>
                    </div>
                  </md-step>

                  <md-step id="third" md-label="Confirm and Submit">
                    <md-card-header>
                      <md-card-header-text>
                        <div class="md-title">Form Results</div>
                        <div class="md-subhead" v-if="depiction">
                          Cover Image: {{ depiction.name }}
                        </div>
                        <div
                          class="md-subhead"
                          v-else-if="oldDepiction && oldDepiction.status !== 'delete'"
                        >
                          Cover Image: {{ oldDepiction.originalname }}
                        </div>
                      </md-card-header-text>

                      <md-card-media md-big v-show="depiction" style="height: 0px">
                        <span id="depictWrapperMini" style="visibility: hidden">
                          <figure>
                            <img id="depictImgMini" src="" alt="Image preview" />
                            <figcaption v-if="oldDepiction">New thumbnail</figcaption>
                          </figure>
                        </span>
                      </md-card-media>
                      <md-card-media md-big v-if="oldDepiction" style="height: 0px">
                        <span>
                          <figure>
                            <img :src="oldDepiction.accessUrl" alt="Image preview" />
                            <figcaption v-if="oldDepiction.status === 'delete' || !!depiction">
                              Old thumbnail. Will be deleted when edits are submitted
                            </figcaption>
                          </figure>
                        </span>
                      </md-card-media>
                    </md-card-header>
                    <md-card-content>
                      <div class="u_margin-bottom-small">
                        <h3>Title:</h3>
                        {{ dataset.title }}
                      </div>
                      <div v-if="dataset.refby.length" class="u_margin-bottom-small">
                        <h3>DOI:</h3>
                        {{ dataset.refby }}
                      </div>
                      <div v-if="dataset.contactPoint['@id']" class="u_margin-bottom-small">
                        <h3>Contact Point:</h3>
                        {{ dataset.contactPoint['firstName'] }}
                        {{ dataset.contactPoint['lastName'] }},
                        {{ dataset.contactPoint['cpEmail'] }}
                      </div>
                      <div class="u_margin-bottom-small">
                        <h3>Files:</h3>
                        <div class="md-subhead" v-if="oldDistributions.length && distrFiles.length">
                          New Uploads
                        </div>
                        <ul>
                          <li
                            v-for="(file, index) in distrFiles"
                            :key="index"
                            class="u--margin-leftsm"
                          >
                            {{ file.file.name }}
                          </li>
                        </ul>
                        <div v-if="oldDistributions.length">
                          <div class="md-subhead">Original Files</div>
                          <ul>
                            <li
                              v-for="(file, index) in oldDistributions"
                              :key="`${index}_old`"
                              class="u--margin-leftsm"
                            >
                              {{ file.name }}
                            </li>
                          </ul>
                        </div>
                        <div v-if="!hasDataDictionary" class="u_margin-bottom-small">
                          <div class="md-subhead" style="color: #ff5252; margin-top: 10px">
                            No data dictionary (.xls/.xlsx) found in uploaded files. You can reuse
                            an existing one from the dataset gallery or go back and upload your own.
                          </div>
                          <div style="margin-top: 10px">
                            <div>
                              <md-field>
                                <label>Paste data dictionary link here</label>
                                <md-input v-model="externalSddLink"></md-input>
                              </md-field>
                            </div>
                            <div style="text-align: center">
                              <button
                                type="button"
                                class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text"
                                @click.prevent="openDatasetGallery"
                              >
                                Click to copy existing SDD from library
                                <md-icon style="color: white; margin-left: 4px"
                                  >arrow_outward</md-icon
                                >
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="u_margin-top-med u_margin-bottom-small">
                        <h3>Description:</h3>
                        {{ dataset.description }}
                      </div>
                      <div v-if="dataset.organization.length" class="u_margin-bottom-small">
                        <h3>Associated Organization(s):</h3>
                        <span v-for="(org, index) in dataset.organization" :key="`org_${index}`">
                          <span v-if="index == 0">{{ org.name }}</span>
                          <span v-else>, {{ org.name }}</span>
                        </span>
                      </div>
                      <div v-if="dataset.datePub['@value']" class="u_margin-bottom-small">
                        <h3>Date published:</h3>
                        {{ dataset.datePub['@value'] }}
                      </div>
                    </md-card-content>
                    <md-card-actions>
                      <md-button class="md-primary" @click="submitForm">Submit</md-button>
                    </md-card-actions>
                  </md-step>
                </md-steppers>
              </form>
            </md-card>
          </div>
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
        <div v-if="dialog.type == 'loading' && uploadInProgress">
          <spinner :text="uploadInProgress" />
        </div>
        <div v-else-if="dialog.type == 'success'">
          <div v-if="!!datasetId">Dataset with ID {{ datasetId }} successfully updated</div>
          <div v-else>New dataset created with ID {{ generatedUUID }}</div>
        </div>
        <div v-else-if="dialog.type == 'deleteOld'">
          <div>
            Selecting "Yes, Delete" will permanently remove the file from the MaterialsMine database
            for all users.
          </div>
          <div>This action cannot be undone.</div>
          <div>
            Selected file:
            <a :href="toDelete?.uri" download>
              {{ toDelete?.name }}
            </a>
          </div>
        </div>
        <div v-else-if="dialog.type == 'doiData'">
          The following data was imported from DOI.org. Use to auto-fill form? This will replace any
          fields that you may have already filled.
          <div v-if="doiData?.title">
            <b>Title: </b>
            {{ doiData?.title?.[0] }}
          </div>
          <div v-if="doiData?.published">
            <b>Date Published: </b>
            {{ doiData?.published?.['date-parts']?.flat() }}
          </div>
        </div>
      </template>
      <template v-slot:actions>
        <div v-if="dialog.type == 'success'">
          <md-button @click="goToDataset">OK</md-button>
        </div>
        <div v-if="dialog.type == 'deleteOld'">
          <md-button @click="toggleDialogBox()">No, Cancel</md-button>
          <md-button @click="deleteDistribution(toDelete)">Yes, Delete</md-button>
        </div>
        <div v-if="dialog.type == 'doiData'">
          <md-button @click="toggleDialogBox()">No, don't use</md-button>
          <md-button @click="useDoiData()">Yes, use imported data</md-button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { debounce } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import FileInput from '@/components/curate/FileDrop.vue';
import FilePreview from '@/components/curate/FilePreview.vue';
import Dialog from '@/components/Dialog.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import Spinner from '@/components/Spinner.vue';
import useFileList from '@/modules/file-list';
import {
  saveDataset,
  isValidOrcid,
  loadDataset,
  parseFileName,
  deleteFile,
} from '@/modules/whyis-dataset';
import { saveSDDDataset } from '@/modules/kg-utils';

// Component name for debugging
defineOptions({
  name: 'SDDHome',
});

// Props
interface Props {
  datasetId?: string;
}

const props = defineProps<Props>();

// Router and store
const router = useRouter();
const store = useStore();

// File list composable
const distrFn = useFileList();

// Interfaces
interface NavRoute {
  label: string;
  path: string;
}

interface ContactPoint {
  '@type': string;
  '@id': string | null;
  firstName: string;
  lastName: string;
  cpEmail: string;
}

interface DatePub {
  '@type': string;
  '@value': string;
}

interface Organization {
  '@id': string;
  '@type': string;
  name: string;
}

interface Dataset {
  '@type': string;
  refby: string;
  title: string;
  contactPoint: ContactPoint;
  description: string;
  contributors: any[];
  datePub: DatePub;
  organization: Organization[];
  creator?: any;
  uri?: string;
}

interface Invalid {
  first: string | null;
  second: string | null;
  orcid: boolean;
}

interface DialogConfig {
  title: string;
  type: string | null;
  minWidth: number;
  disableClose: boolean;
}

interface OldDistribution {
  uri: string;
  name: string;
  fileId?: string;
}

interface OldDepiction {
  accessUrl: string;
  originalname: string;
  status: string;
}

// Default dataset structure
const DEFAULT_DATASET: Dataset = {
  '@type': 'http://www.w3.org/ns/dcat#Dataset',
  refby: '',
  title: '',
  contactPoint: {
    '@type': 'schemaPerson',
    '@id': null,
    firstName: '',
    lastName: '',
    cpEmail: '',
  },
  description: '',
  contributors: [],
  datePub: {
    '@type': 'date',
    '@value': '',
  },
  organization: [],
};

// Reactive data
const loading = ref(false);
const navRoutes = ref<NavRoute[]>([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
]);

const active = ref('first');
const invalid = ref<Invalid>({
  first: null,
  second: null,
  orcid: false,
});
const doi = ref('');
const orcidId = ref<string | null>(null);
const searchKeywordOrg = ref('');
const showDropdown = ref(false);
const distrFiles = distrFn.files;
const depiction = ref<File | null>(null);
const dataset = ref<Dataset>({ ...DEFAULT_DATASET });
const oldDistributions = ref<OldDistribution[]>([]);
const toDelete = ref<OldDistribution | null>(null);
const oldDepiction = ref<OldDepiction | null>(null);
const dialog = ref<DialogConfig>({
  title: '',
  type: null,
  minWidth: 60,
  disableClose: false,
});
const uploadInProgress = ref<string | null>(null);
const externalSddLink = ref('');

// Computed
const dialogBoxActive = computed(() => store.getters['dialogBox']);
const doiData = computed(() => store.getters['explorer/curation/getDoiData']);
const orcidData = computed(() => store.getters['explorer/curation/getOrcidData']);
const organizations = computed(() => store.getters['explorer/curation/getRorData']);

const secondPageFilled = computed(() => {
  return (
    !!dataset.value.title &&
    !!dataset.value?.contactPoint?.['@id'] &&
    !!dataset.value.contactPoint.firstName &&
    !!dataset.value.contactPoint.lastName &&
    !!dataset.value.contactPoint.cpEmail &&
    !!dataset.value.description &&
    !invalid.value.orcid
  );
});

const userInfo = computed(() => {
  return {
    '@id': `https://materialsmine.org/api/user/${store.getters['auth/userId']}`,
    firstName: store.getters['auth/user'].givenName,
    lastName: store.getters['auth/user'].surName,
  };
});

const generatedUUID = computed(() => {
  return uuidv4();
});

const hasDataDictionary = computed(() => {
  const xlsRegex = /\.xlsx?$/i;
  const newFiles = distrFiles.value.some((f: any) =>
    xlsRegex.test(f.file?.name?.split('?')[0] || '')
  );
  const oldFiles = oldDistributions.value.some((f) => xlsRegex.test(f.name?.split('?')[0] || ''));
  return newFiles || oldFiles;
});

// Watch
watch(orcidData, (newValue) => {
  if (newValue === 'invalid') {
    invalid.value.orcid = true;
  } else {
    invalid.value.orcid = false;
    dataset.value.contactPoint['@id'] = orcidData.value?.['@id'];
    dataset.value.contactPoint.firstName = orcidData.value?.firstName;
    dataset.value.contactPoint.lastName = orcidData.value?.lastName;
    dataset.value.contactPoint.cpEmail = orcidData.value?.email;
  }
});

watch(searchKeywordOrg, (newVal) => {
  if (newVal) {
    lookupOrganization({ query: newVal });
  }
  showDropdown.value = true;
});

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const setSnackbar = (payload: any) => {
  store.commit('setSnackbar', payload);
};

const clearSnackbar = () => {
  store.commit('resetSnackbar');
};

const addDistr = (files: File[]) => distrFn.addFiles(files);
const removeDistr = (file: any) => distrFn.removeFile(file);
const modStatDistr = distrFn.modifyStatus;
const clearFileList = distrFn.clearAllFiles;

// const navBack = () => {
//   router.back();
// };

const loadDatasetData = async () => {
  try {
    const response = await loadDataset(
      `${window.location.origin}/explorer/dataset/${props.datasetId}`
    );
    if (response[0]?.refby.length) {
      doi.value = response[0]?.refby[0].split('.org/')[1];
    }
    dataset.value = response[0];
    oldDistributions.value = response?.[1] || [];
    if (response?.[2]) {
      const thumbnailResponse = await store.dispatch(
        'explorer/fetchDatasetThumbnail',
        response?.[2]?.[0]?.['@id']
      );
      const accessUrl = thumbnailResponse[0]?.['@value'] ?? '';
      oldDepiction.value = {
        accessUrl,
        originalname: parseFileName(accessUrl),
        status: 'complete',
      };
    }
    orcidId.value = response?.[0]?.contactPoint?.['@id']?.split('http://orcid.org/')[1];
    lookupOrcid(orcidId.value);
    if (dataset.value?.organization?.length) {
      const orgs = dataset.value.organization.map(async (org) => {
        const rorId = org['@id'].split('https://ror.org/')[1];
        const rorOrg = await store.dispatch('explorer/curation/searchRor', { id: rorId });
        return {
          '@id': org['@id'],
          '@type': 'organization',
          name: rorOrg[0].name,
        };
      });
      dataset.value.organization = await Promise.all(orgs);
    }
  } catch (e: any) {
    store.commit('setSnackbar', { message: e });
    loading.value = false;
  }
};

const onInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    addDistr(Array.from(target.files));
  }
  target.value = '';
  invalid.value.first = null;
};

const goToStep = (id: string, index?: string) => {
  clearSnackbar();
  if (id === 'first' && !distrFiles.value.length && !oldDistributions.value?.length) {
    invalid.value.first = 'Missing required field';
  } else if (id === 'second' && !secondPageFilled.value) {
    invalid.value.second = 'Missing required field';
  } else {
    // Clear invalid errors
    if (id === 'first') invalid.value.first = null;
    if (id === 'second') invalid.value.second = null;
    if (index) {
      active.value = index;
      if (index === 'third' && !hasDataDictionary.value) {
        store.commit('setSnackbar', {
          message:
            'No data dictionary (.xls/.xlsx) found. You can reuse an existing one from the dataset gallery or go back and upload your own.',
          duration: 10000,
        });
      }
    }
  }
};

const lookupOrcid = async (e: any) => {
  const id = e?.target?.value ?? e;
  if (isValidOrcid(id)) {
    invalid.value.orcid = false;
    await store.dispatch('explorer/curation/lookupOrcid', id);
  } else {
    invalid.value.orcid = true;
  }
};

const openDatasetGallery = (): void => {
  const routeData = router.resolve({ name: 'DatasetGallery' });
  window.open(routeData.href, '_blank');
};

const lookupDoi = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  await store.dispatch('explorer/curation/lookupDoi', target.value);
  await nextTick();
  if (doiData.value) {
    dataset.value.refby = doiData.value?.URL;
    renderDialog('Use imported DOI data?', 'doiData', 40);
  }
};

const lookupOrganization = debounce((payload: any) => {
  store.dispatch('explorer/curation/searchRor', payload);
}, 300);

const selectOrg = (item: any) => {
  const formatOrg: Organization = {
    '@id': item.id,
    '@type': 'organization',
    name: item.name,
  };
  if (!dataset.value.organization.includes(formatOrg)) {
    dataset.value.organization.push(formatOrg);
    searchKeywordOrg.value = '';
    return;
  }
  store.commit('setSnackbar', {
    message: 'Duplicate Value Entered',
    duration: 3000,
  });
};

const deleteOrg = (arr: Organization[], e: number) => {
  arr.splice(e, 1);
};

const setDropdownPosition = () => {
  return {
    position: 'relative',
    top: '-2rem',
    zIndex: 10,
    minHeight: 'auto',
  };
};

const disableDropdownRender = (e: Event) => {
  const target = e.target as HTMLElement;
  const selected = target.closest('.search_box');
  if (!selected) {
    showDropdown.value = false;
  }
};

const useDoiData = () => {
  dataset.value.title = doiData.value?.title?.[0] ?? dataset.value.title;
  if (doiData.value?.published?.['date-parts']?.flat()?.length === 3) {
    const dateArray = doiData.value.published['date-parts'].flat();
    dataset.value.datePub['@value'] =
      dateArray[0].toString() +
      '-' +
      (dateArray[1] < 10 ? '0' + dateArray[1].toString() : dateArray[1].toString()) +
      '-' +
      (dateArray[2] < 10 ? '0' + dateArray[2].toString() : dateArray[2].toString());
  }
  toggleDialogBox();
};

const previewFile = () => {
  const preview = document.querySelector('#depictImg') as HTMLImageElement;
  const wrapper = document.querySelector('#depictWrapper') as HTMLElement;
  const previewMini = document.querySelector('#depictImgMini') as HTMLImageElement;
  const wrapperMini = document.querySelector('#depictWrapperMini') as HTMLElement;
  const fileInput = document.querySelector('#file-depict-input') as HTMLInputElement;
  const file = fileInput?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  depiction.value = file;

  reader.addEventListener(
    'load',
    function () {
      wrapper.style.visibility = wrapperMini.style.visibility = 'visible';
      preview.src = previewMini.src = reader.result as string;
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  const wrapper = document.querySelector('#depictWrapper') as HTMLElement;
  const fileInput = document.querySelector('#file-depict-input') as HTMLInputElement;
  const imgElement = document.querySelector('#depictImg') as HTMLImageElement;

  wrapper.style.visibility = 'hidden';
  fileInput.value = '';
  imgElement.src = '';
  depiction.value = null;
};

const renderDialog = (title: string, type: string, minWidth: number, disableClose = false) => {
  dialog.value = {
    title,
    type,
    minWidth,
    disableClose,
  };
  toggleDialogBox();
};

const deleteDistribution = async (file: OldDistribution | null) => {
  if (!file) return;
  try {
    await deleteFile(file?.fileId);
    const index = oldDistributions.value.indexOf(file);
    if (index > -1) oldDistributions.value.splice(index, 1);
  } catch (e: any) {
    store.commit('setSnackbar', { message: e });
  }
  toggleDialogBox();
};

const confirmDeletion = (file: OldDistribution) => {
  toDelete.value = file;
  toDelete.value.fileId = parseFileName(file?.uri, true);
  renderDialog('Delete file?', 'deleteOld', 40, false);
};

const processFiles = () => {
  return distrFiles.value
    .map((file) => ({ ...file, status: 'incomplete' }))
    .concat(oldDistributions.value.map((file) => ({ ...file, status: 'complete' })));
};

const processDepictions = () => {
  const depictions: any[] = [];
  if (depiction.value) {
    depictions.push({ file: depiction.value, status: 'incomplete' });
    if (oldDepiction.value) {
      oldDepiction.value.status = 'delete';
    }
  }
  if (oldDepiction.value) depictions.push({ ...oldDepiction.value });
  return depictions;
};

const submitForm = async () => {
  uploadInProgress.value = 'Uploading files';
  renderDialog('Submitting dataset', 'loading', 40, true);
  clearSnackbar();
  if ((!distrFiles.value.length && !oldDistributions.value?.length) || !secondPageFilled.value) {
    setSnackbar({
      message: 'Unable to submit, check for required fields',
    });
    toggleDialogBox();
    invalid.value.first =
      !distrFiles.value.length && !oldDistributions.value?.length ? 'Missing required field' : null;
    invalid.value.second = !secondPageFilled.value ? 'Missing required field' : null;
  } else {
    const metadata = {
      did: props.datasetId ?? generatedUUID.value,
      user: userInfo.value,
      doi: doi.value,
      externalSddLink: externalSddLink.value,
      title: dataset.value.title,
      datePub: dataset.value.datePub,
      organizations: dataset.value.organization,
      contactPoint: dataset.value.contactPoint,
      description: dataset.value.description,
    };

    const processedFiles = processFiles();
    const processedImg = processDepictions();

    try {
      const datasetNanopub = await saveSDDDataset(processedFiles, processedImg, metadata);
      await store.dispatch('explorer/curation/cacheNewEntityResponse', {
        identifier: datasetNanopub.identifier,
        resourceNanopub: datasetNanopub,
        type: 'datasets',
      });
      dialog.value.title = 'Upload successful';
      dialog.value.type = 'success';
    } catch (err: any) {
      toggleDialogBox();
      setSnackbar({ message: err.response ?? err });
      clearFileList();
      doi.value = '';
      dataset.value = { ...DEFAULT_DATASET };
      active.value = 'first';
    }
  }
};

// TODO: (@Tee): Remove after complete SDD gallery migration
// const submitForm = async () => {
//   uploadInProgress.value = 'Uploading files';
//   renderDialog('Submitting dataset', 'loading', 40, true);
//   clearSnackbar();
//   if ((!distrFiles.value.length && !oldDistributions.value?.length) || !secondPageFilled.value) {
//     setSnackbar({
//       message: 'Unable to submit, check for required fields',
//     });
//     toggleDialogBox();
//     invalid.value.first =
//       !distrFiles.value.length && !oldDistributions.value?.length ? 'Missing required field' : null;
//     invalid.value.second = !secondPageFilled.value ? 'Missing required field' : null;
//   } else {
//     dataset.value.creator = userInfo.value;
//     const processedFiles = processFiles();
//     const processedImg = processDepictions();
//     try {
//       const datasetNanopub = await saveDataset(
//         dataset.value,
//         processedFiles,
//         processedImg,
//         generatedUUID.value,
//         externalSddLink.value
//       );
//       await store.dispatch('explorer/curation/cacheNewEntityResponse', {
//         identifier: dataset.value.uri,
//         resourceNanopub: datasetNanopub,
//         type: 'datasets',
//       });
//       dialog.value.title = 'Upload successful';
//       dialog.value.type = 'success';
//     } catch (err: any) {
//       toggleDialogBox();
//       setSnackbar({ message: err.response ?? err });
//       clearFileList();
//       doi.value = '';
//       dataset.value = { ...DEFAULT_DATASET };
//       active.value = 'first';
//     }
//   }
// };

const goToDataset = () => {
  toggleDialogBox();
  const datasetId = props.datasetId ?? generatedUUID.value;
  clearFileList(); // Reset imported module
  dataset.value = { ...DEFAULT_DATASET }; // Reset dataset
  return router.push(`/explorer/dataset/${datasetId}`);
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  if (props.datasetId) await loadDatasetData();
  loading.value = false;
});
</script>
