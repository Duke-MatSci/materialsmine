<template>
  <div>
    <div>
      <CurateNavBar active="Link Dataset to SDD" :navRoutes="navRoutes" />
    </div>
    <div>
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text="Loading Dataset" />
      </div>
      <div v-else class="curate">
        <md-card style="margin: 10px">
          <form
            class="modal-content"
            action=""
            method="post"
            enctype="multipart/form-data"
            upload_type="http://www.w3.org/ns/dcat#Dataset"
          >
            <md-steppers class="form__stepper" :md-active-step.sync="active" md-linear>
              <md-step id="first" md-label="Dataset Info">
                Linking has not been completed for this dataset. Are you ready to finish linking
                the data?
                <a>Click here</a> if you'd like to request assistance from an admin.

                <md-card-header>
                  <md-card-header-text>
                    <div class="md-subhead">Dataset Summary:</div>
                    <div class="md-title">
                      {{ dataset?.[datasetFields.title]?.[0]?.['@value'] || 'Curated Dataset' }}
                    </div>
                    <!-- <div class="md-subhead" v-if="dataset[datasetFields['depiction']]">Cover Image: {{ depiction.name }}</div> -->
                  </md-card-header-text>

                  <md-card-media
                    md-big
                    v-show="dataset?.[datasetFields.depiction]"
                    style="height: 0px"
                  >
                    <span id="depictWrapperMini">
                      <figure>
                        <img
                          id="depictImgMini"
                          v-if="thumbnail"
                          :src="thumbnail?.[0]?.['@value']"
                          alt="Image preview"
                        />
                      </figure>
                    </span>
                  </md-card-media>
                </md-card-header>
                <md-card-content>
                  <div v-if="dataset?.[datasetFields.doi]">
                    DOI: <a class="u--b-rad">{{ doi }}</a>
                  </div>
                  <div class="u_margin-bottom-small">
                    {{ dataset?.[datasetFields.description]?.[0]?.['@value'] }}
                  </div>
                  <div v-if="orcidData" class="u_margin-bottom-small">
                    <span>
                      <h3>Contact Point:</h3>
                      {{
                        orcidData?.['http://schema.org/givenName']?.[0]?.['@value'] || ''
                      }}
                      {{ orcidData?.['http://schema.org/familyName']?.[0]?.['@value'] || '' }}
                    </span>
                    <div>
                      <a class="u--b-rad" :href="orcidData?.['@id']" target="_blank">
                        {{
                          orcidData?.['@id'] ||
                          dataset?.[datasetFields.cp]?.[0]?.['@id'] ||
                          'N/A'
                        }}
                      </a>
                    </div>
                    <div v-if="orcidData?.['http://www.w3.org/2006/vcard/ns#email']">
                      {{
                        orcidData?.['http://www.w3.org/2006/vcard/ns#email']?.[0]?.['@value'] ||
                          'N/A'
                      }}
                    </div>
                  </div>
                  <div class="u_margin-bottom-small">
                    <h3>Files:</h3>
                    <ul>
                      <li
                        v-for="(file, index) in distributions"
                        :key="`file_${index}`"
                        class="u--margin-leftsm"
                      >
                        <a :href="file.downloadLink" download>
                          {{ file.label }}
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div v-if="dataset?.[datasetFields.datePub]">
                    <span class="u--color-black"> Date Published: </span>
                    <span>
                      {{ dataset?.[datasetFields.datePub]?.[0]?.['@value'] || 'N/A' }}
                    </span>
                  </div>
                </md-card-content>
                <div class="md-card-actions md-alignment-right chart_editor__right-view">
                  <md-button @click="goToStep('first', 'second')" class="md-theme-default md-button_next">
                    Next
                  </md-button>
                </div>
              </md-step>
              <md-step id="second" md-label="URI namespace">
                <div class="md-layout">
                  <div style="margin: 20px">
                    Do you want to use the default namespace? If you're not sure, skip this step.
                    <div>
                      <md-radio
                        v-model="defaultNamespace"
                        :value="true"
                        style="margin-left: 4rem"
                        class="md-primary"
                        >Yes, use default</md-radio
                      >
                      <md-radio
                        v-model="defaultNamespace"
                        :value="false"
                        style="margin-left: 4rem"
                        class="md-primary"
                        >No, use custom</md-radio
                      >
                    </div>
                    <div class="md-layout-item md-size-50" v-if="!defaultNamespace">
                      <md-field>
                        <label>Custom Namespace</label>
                        <md-input v-model="namespace"></md-input>
                      </md-field>
                    </div>
                  </div>
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
                </div>
              </md-step>
              <md-step id="third" md-label="CSV Files" :md-error="invalid.third">
                <div class="md-layout">
                  <md-content>
                    <div>What delimiter is used in the .csv file(s)?</div>
                    <div>
                      <div
                        v-for="(item, index) in distributions"
                        :key="`csv_${index}`"
                        class="md-layout md-gutter u_height--max"
                      >
                        <div
                          class="md-layout-item"
                          style="margin: 2rem; padding: 1rem"
                          v-if="item.fileExtension === 'csv'"
                        >
                          {{ item.label }}:
                        </div>
                        <div class="md-layout-item" v-if="item.fileExtension === 'csv'">
                          <md-field style="max-width: 40%">
                            <label>delimiter</label>
                            <md-input v-model="distributions[index]['delimiter']"></md-input>
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
                          @click="goToStep('third', 'second')"
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
                          @click="goToStep('third', 'fourth')"
                          class="md-theme-default md-button_next"
                        >
                          Next
                        </md-button>
                      </div>
                    </div>
                  </md-card-actions>
                </div>
              </md-step>
              <md-step id="fourth" md-label="SDD File" :md-error="invalid.fourth">
                <h3>Is one of the files a Semantic Data Dictionary (SDD)?</h3>
                <div style="margin: 2rem">
                  If yes, select the SDD(s) from the list of files:
                  <div v-for="(item, index) in distributions" :key="`distrs_${index}`">
                    <md-checkbox v-model="isSddArray" :value="index" class="md-primary">
                      {{ item.label }}
                    </md-checkbox>
                  </div>
                </div>

                <h3>Which SDD does your dataset follow?</h3>
                <div style="margin: 2rem">
                  <div>
                    <md-checkbox
                      v-model="whichSdd"
                      value="uploaded"
                      class="md-primary"
                      v-if="isSddArray.length"
                    >
                      The uploaded SDD:
                      <span class="">
                        <select class="" v-model="selectSdd" name="selectSdd" id="selectSdd">
                          <option v-for="index in isSddArray" :key="`sdds_${index}`">
                            {{ distributions[index]['label'] + ' ' }}
                          </option>
                        </select>
                      </span>
                    </md-checkbox>
                  </div>
                  <div>
                    <md-checkbox v-model="whichSdd" value="other" class="md-primary"
                      >A different SDD previously uploaded that isn't one of these
                      files</md-checkbox
                    >
                  </div>
                  <div>
                    <md-checkbox v-model="whichSdd" value="none" class="md-primary"
                      >The SDD used by my data hasn't been uploaded yet</md-checkbox
                    >
                  </div>
                </div>

                <div class="md-layout-item md-size-50" v-if="whichSdd == 'other'">
                  <md-field>
                    <label>Search for SDD</label>
                    <md-input v-model="searchSdd"></md-input>
                  </md-field>
                </div>
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Spinner from '@/components/Spinner.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import { parseFileName } from '@/modules/whyis-dataset';
import { postNewNanopub } from '@/modules/whyis-utils';

// Component name for debugging
defineOptions({
  name: 'SDDLinking',
});

// Props
interface Props {
  datasetId: string;
}

const props = defineProps<Props>();

// Router and store
const router = useRouter();
const store = useStore();

// Interfaces
interface NavRoute {
  label: string;
  path: string;
}

interface Distribution {
  downloadLink: string;
  label: string;
  fileExtension: string;
  delimiter: string | null;
  isSdd?: boolean;
}

interface InvalidSteps {
  third: string | null;
  fourth: string | null;
}

// Reactive data
const loading = ref(true);
const navRoutes = ref<NavRoute[]>([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
  {
    label: 'Edit Dataset',
    path: `/explorer/curate/sdd/edit/${props.datasetId}`,
  },
]);

const datasetFields = {
  description: 'http://purl.org/dc/terms/description',
  doi: 'http://purl.org/dc/terms/isReferencedBy',
  datePub: 'http://purl.org/dc/terms/issued',
  title: 'http://purl.org/dc/terms/title',
  cp: 'http://www.w3.org/ns/dcat#contactpoint',
  distribution: 'http://www.w3.org/ns/dcat#distribution',
  depiction: 'http://xmlns.com/foaf/0.1/depiction',
};

const distributions = ref<Distribution[]>([]);
const isSddArray = ref<number[]>([]);
const whichSdd = ref<string | null>(null);
const selectSdd = ref('');
const active = ref('first');
const invalid = ref<InvalidSteps>({
  third: null,
  fourth: null,
});
const defaultNamespace = ref(true);
const namespace = ref('');
const searchSdd = ref('');

// Computed
const dataset = computed(() => store.getters['explorer/getCurrentDataset']);
const thumbnail = computed(() => store.getters['explorer/getDatasetThumbnail']);
const orcidData = computed(() => store.getters['explorer/curation/getOrcidData']);

const doi = computed(() => {
  if (dataset.value?.[datasetFields.doi]) {
    const doiString = dataset.value[datasetFields.doi][0]['@value'];
    return doiString.replace('http://dx.doi.org/', '');
  }
  return '';
});

const fullDatasetUri = computed(() => {
  return `${window.location.origin}/explorer/dataset/${props.datasetId}`;
});

const title = computed(() => {
  return dataset.value?.[datasetFields.title]?.[0]?.['@value'] || '';
});

// Watch for dataset changes
watch(
  dataset,
  (newValues) => {
    loading.value = false;
    if (newValues?.[datasetFields.cp]) {
      const orcid = newValues[datasetFields.cp][0]['@id'];
      const trimmedId = orcid
        .replace('http://orcid.org/', '')
        .replace(`${window.location.origin}/`, '');
      lookupOrcid(trimmedId);
    }
    if (newValues?.[datasetFields.depiction]) {
      const thumbnailUri = newValues[datasetFields.depiction][0]['@id'];
      store.dispatch('explorer/fetchDatasetThumbnail', thumbnailUri);
    }
    if (newValues?.[datasetFields.distribution]) {
      for (const index in newValues[datasetFields.distribution]) {
        const downloadLink = newValues[datasetFields.distribution][index]?.['@id'];
        const label = parseFileName(downloadLink);
        const fileExtension = label.split('.').pop()?.toLowerCase() || '';
        distributions.value[parseInt(index)] = {
          downloadLink,
          label,
          fileExtension,
          delimiter: null,
        };
      }
    }
  },
  { immediate: true }
);

// Methods
const replaceBaseUrl = (originalUrl: string, oldBase: string, newBase: string): string => {
  return originalUrl.replace(oldBase, newBase);
};

const loadDataset = async () => {
  try {
    await store.dispatch('explorer/fetchSingleDataset', fullDatasetUri.value || undefined);
  } catch (e: any) {
    store.commit('setSnackbar', { message: e });
  } finally {
    loading.value = false;
  }
};

const lookupOrcid = (id: string) => {
  store.dispatch('explorer/curation/lookupOrcid', id);
};

const goToStep = (id: string, index?: string) => {
  store.commit('resetSnackbar');
  if (id === 'third' && checkInvalidThird()) return;
  active.value = index || id;
};

const checkInvalidThird = (): boolean => {
  let isInvalid = false;
  const csvs = distributions.value.filter((x) => x.fileExtension === 'csv');
  for (const index in csvs) {
    isInvalid = isInvalid || !csvs[index].delimiter;
  }
  if (isInvalid) invalid.value.third = 'Check delimiters';
  else invalid.value.third = null;
  return isInvalid;
};

const processSddList = () => {
  for (const index in isSddArray.value) {
    const distrInd = isSddArray.value[index];
    distributions.value[distrInd].isSdd = true;
  }
};

const createDatasetLd = () => {
  const jsonLd: any = {
    '@id': fullDatasetUri.value,
  };
  let namespaceValue = `${fullDatasetUri.value}/`;
  if (!defaultNamespace.value && namespace.value) {
    namespaceValue = namespace.value;
  }
  jsonLd['http://rdfs.org/ns/void#uriSpace'] = {
    '@value': namespaceValue,
    '@lang': null,
    '@type': 'http://www.w3.org/2001/XMLSchema#string',
  };
  return jsonLd;
};

const createFileLd = (index: number) => {
  const distribution = distributions.value[index];
  const jsonLd: any = {
    '@id': replaceBaseUrl(
      distribution.downloadLink,
      'http://localhost/api/',
      `${window.location.origin}/api/`
      // Note: When testing SDD linking locally enable below logic and comment above
      // 'http://restful:3001/'
    ),
  };
  if (distribution.fileExtension === 'csv') {
    jsonLd['http://www.w3.org/ns/csvw#delimiter'] = {
      '@value': distribution.delimiter,
      '@type': 'http://www.w3.org/2001/XMLSchema#string',
    };
    jsonLd['http://open.vocab.org/terms/hasContentType'] = 'text/csv';
    if (whichSdd.value === 'other' && searchSdd.value) {
      jsonLd['http://purl.org/dc/terms/conformsTo'] = {
        '@id': searchSdd.value,
      };
    } else if (whichSdd.value === 'uploaded' && selectSdd.value) {
      // Runs this if SDD is part of the dataset submission
      const file = distributions.value.find((file) => file.downloadLink.includes(selectSdd.value));
      jsonLd['http://purl.org/dc/terms/conformsTo'] = {
        '@id': replaceBaseUrl(
          file?.downloadLink || '',
          'http://localhost/api/',
          `${window.location.origin}/api/`
          // Note: When testing SDD linking locally enable below logic and comment above
          // 'http://restful:3001/'
        ),
      };
    }
  } else if (distribution?.isSdd) {
    jsonLd['@type'] = 'http://purl.org/twc/sdd/SemanticDataDictionary';
  }
  return jsonLd;
};

const submitForm = async () => {
  store.commit('resetSnackbar');
  if (checkInvalidThird()) {
    return store.commit('setSnackbar', {
      message: 'Check for errors in required fields',
    });
  }
  processSddList();
  const datasetJsonLd = createDatasetLd();
  const promises: Promise<any>[] = [];
  promises.push(postNewNanopub(datasetJsonLd));
  for (const file in distributions.value) {
    promises.push(postNewNanopub(createFileLd(parseInt(file))));
  }
  Promise.all(promises)
    .then((response) => {
      // TODO: Remove later - consume response in snackbar
      console.log(response);
      return store.commit('setSnackbar', {
        message: 'SDD linking completed successfully',
        // explorer/dataset/4acae5dd-8986-4177-8836-38901591fce0
        action: () => router.push(`/explorer/dataset/${props.datasetId}`),
        callToActionText: 'View',
      });
    })
    .catch((e) => {
      throw e;
    });
};

// Lifecycle
onMounted(() => {
  loading.value = true;
  loadDataset();
});
</script>
