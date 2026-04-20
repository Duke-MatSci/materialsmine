<template>
  <div class="datasets">
    <md-card style="width:100%;">
      <md-card-header class="dataset-header md-layout md-alignment-top-space-between">
        <span class="md-layout-item">
          <md-button class="md-primary md-raised md-icon-button" @click="toggleDatasetHide">
            <md-icon v-if="!datasetHideSelector">expand_more</md-icon>
            <md-icon v-else>expand_less</md-icon>
          </md-button>
          <md-button v-if="isAuth" class="md-primary md-raised md-icon-button"
            @click="toggleDatasetCard">
            <md-icon>library_add</md-icon>
          </md-button>
          <md-button v-if="datasetsHeaderInfoIcon" class="md-primary md-raised md-icon-button"
            @click="datasetInfoDialog()">
            <md-icon>info</md-icon>
          </md-button>
          {{datasetsHeaderTitle}}
        </span>
        <span class="md-layout-item" style="width:50%;" v-show="datasetSelected !== null">{{headerDOI}}</span>
      </md-card-header>
      <md-card v-if="addDatasetDialogActive">
        <md-field>
          <label>Enter a comment to describe this dataset as uniquely as possible</label>
          <md-input v-model="addDatasetComment"></md-input>
        </md-field>
        <md-button @click="addDatasetDialogActive=false; addDatasetComment=''" small>Cancel</md-button>
        <md-button @click="addDatasetSave()" small color="primary" class="white--text">Save</md-button>
      </md-card>

      <md-table v-model="displayDatasets" v-show="!datasetHideSelector" md-sort="seq" md-sort-order="asc" md-card
        md-fixed-header>
        <md-table-toolbar>
          <div class="md-toolbar-section-start">
            <h1 v-if="mineOnlyAlways" class="md-title">Datasets you've created</h1>
          </div>
          <div v-if="isAuth && !mineOnlyAlways">
            <md-checkbox v-model="showMineOnly" class="md-primary">Show mine only</md-checkbox>
          </div>
          <md-field md-clearable class="md-toolbar-section-end">
            <md-input placeholder="Filter datasets" v-model="datasetSearch"></md-input>
          </md-field>
        </md-table-toolbar>

        <md-table-empty-state md-label="No data available"
          :md-description="`Your search for '${datasetSearch}' returned no results.`"></md-table-empty-state>

        <template #md-table-row="{ item }">
          <md-table-row @click="datasetClick(item)" :key="item.seq">
            <md-table-cell md-label="ID" md-sort-by="seq" md-numeric>{{ item.seq }}</md-table-cell>
            <md-table-cell md-label="DOI" md-sort-by="doi">{{ item.doi }}</md-table-cell>
            <md-table-cell md-label="Title" md-sort-by="title">{{ item.title }}</md-table-cell>
            <md-table-cell md-label="Comment" md-sort-by="datasetComment">{{ item.datasetComment }}</md-table-cell>
          </md-table-row>
        </template>
      </md-table>
    </md-card>
    <Dialog :active="dialogBoxActive">
      <template #title>{{ dialog.title }}</template>
      <template #content>{{ dialog.content }}</template>
      <template #actions>
        <md-button @click.prevent="toggleDialogBox">Close</md-button>
      </template>
    </Dialog>
    <!--

    Dataset Info Dialog

    -->
    <Dialog :active="datasetInfoDialogActive">
      <template #title>Dataset Information</template>
      <template #content>
        <md-list class="md-double-line">
          <md-list-item v-for="(item, index) in datasetDialogInfo.items" :key="index">
            <v-subheader v-if="item.header" :key="item.header">
              {{ item.header }}
            </v-subheader>

            <md-divider v-else-if="item.divider" :key="index"></md-divider>

            <div v-else :key="item.title" class="md-list-item-text">
              <span v-html="item.title"></span>
              <span v-html="item.subtitle"></span>
            </div>
          </md-list-item>
        </md-list>
      </template>
      <template #actions>
        <md-button @click="datasetInfoDialogActive = false">Close</md-button>
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useStore } from 'vuex';
import Dialog from '@/components/Dialog.vue';
import * as _ from 'lodash';

defineOptions({
  name: 'DatasetCreateOrSelect',
});

interface Props {
  datasetOptions?: DatasetOptions;
  selectHeader?: string;
  selectedHandler?: ((dataset: Dataset | null) => void) | null;
}

interface DatasetOptions {
  mineOnly?: 'true' | 'false' | 'always';
}

interface Dataset {
  _id: string;
  seq?: number;
  doi?: string;
  title?: string;
  datasetComment?: string;
  userID?: string;
  filesets?: any[];
  [key: string]: any;
}

interface DialogState {
  title: string;
  content: string;
}

interface DatasetDialogInfo {
  items: Array<{
    header?: string;
    divider?: boolean;
    inset?: boolean;
    title?: string;
    subtitle?: string;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  datasetOptions: () => ({}),
  selectHeader: 'Choose a dataset',
  selectedHandler: null
});

const store = useStore();

// Data
const msg = ref<string>('Hi');
const showMineOnly = ref<boolean>(true);
const mineOnlyAlways = ref<boolean>(false);
const addDatasetDialogActive = ref<boolean>(false);
const addDatasetComment = ref<string>('');
const datasetsError = ref<boolean>(false);
const datasetsErrorMsg = ref<string>('');
const datasetTransformed = ref<Record<string, any>>({});
const datasetHideSelector = ref<boolean>(true);
const datasetList = ref<Dataset[]>([]);
const datasetSearch = ref<string>('');
const displayDatasets = ref<Dataset[]>([]);
const datasetSelected = ref<Dataset | null>(null);
const datasetInfoDialogActive = ref<boolean>(false);
const datasetDialogInfo = ref<DatasetDialogInfo>({ items: [] });
const dialogBoxActive = ref<boolean>(false);
const dialog = ref<DialogState>({ title: '', content: '' });

// Computed
const isAuth = computed<boolean>(() => store.getters['auth/isAuthenticated']);
const userId = computed<string>(() => store.getters['auth/userId'] || '0');
const runAsUser = computed<string | false>(() => store.getters['auth/runAsUser'] || false);

const datasetsHeaderTitle = computed<string>(() => {
  if (datasetSelected.value) {
    return 'Selected Dataset:';
  } else {
    return props.selectHeader;
  }
});

const datasetsHeaderInfoIcon = computed<boolean>(() => {
  return !!datasetSelected.value;
});

const headerDOI = computed<string | null>(() => {
  if (datasetSelected.value) {
    if (!datasetSelected.value.doi || datasetSelected.value.doi.length < 1 || datasetSelected.value.doi === 'unpublished-initial-create') {
      return datasetSelected.value.datasetComment || '';
    } else {
      return datasetSelected.value.doi;
    }
  }
  return null;
});

// Methods
const overrideOptions = (datasetOptions: DatasetOptions): void => {
  mineOnlyAlways.value = false;
  if (datasetOptions.mineOnly === 'always') {
    mineOnlyAlways.value = true;
    showMineOnly.value = true;
  } else if (datasetOptions.mineOnly === 'true') {
    showMineOnly.value = true;
  } else {
    showMineOnly.value = false;
  }
};

const datasetInfoDialog = (): void => {
  datasetInfoDialogActive.value = true;
};

const toggleDatasetHide = (): void => {
  datasetHideSelector.value = !datasetHideSelector.value;
  datasetSelected.value = null;
  if (props.selectedHandler && typeof props.selectedHandler === 'function') {
    props.selectedHandler(datasetSelected.value);
  }
};

const getDatasets = (): void => {
  fetch('/api/dataset')
    .then(function (resp) {
      return resp.json();
    })
    .then(function (data) {
      data.data.forEach(function (v: Dataset) {
        datasetList.value.push(v);
      });
    })
    .catch(function (err) {
      datasetsError.value = true;
      if (isAuth.value) {
        renderDialog('Datasets Error', 'Please try again later.');
      }
    });
};

const transformDataset = (entry: Dataset): Record<string, any> => {
  const transformed: Record<string, any> = {};
  _.keys(entry).forEach((k) => {
    if (k !== 'filesets' && k !== '__v' && k !== 'dttm_created' && k !== 'dttm_updated') {
      if (Array.isArray(entry[k])) {
        if (entry[k].length > 0) {
          transformed[k] = entry[k].join('; ');
        } else {
          transformed[k] = 'N/A';
        }
      } else {
        transformed[k] = entry[k];
      }
      if (transformed[k] === null) {
        transformed[k] = 'N/A';
      }
    }
  });
  datasetDialogInfo.value = {
    items: [
      { header: transformed.doi }
    ]
  };
  _.keys(transformed).forEach((k) => {
    datasetDialogInfo.value.items.push({
      title: k,
      subtitle: transformed[k]
    });
    datasetDialogInfo.value.items.push({
      divider: true,
      inset: true
    });
  });
  return transformed;
};

const datasetClick = (entry: Dataset): void => {
  datasetSelected.value = entry;
  datasetTransformed.value = transformDataset(entry);
  datasetHideSelector.value = true;
  datasetsError.value = false;
  datasetsErrorMsg.value = '';
  if (props.selectedHandler && typeof props.selectedHandler === 'function') {
    props.selectedHandler(datasetSelected.value);
  }
};

const toggleDatasetCard = (): void => {
  addDatasetDialogActive.value = !addDatasetDialogActive.value;
};

const addDatasetSave = (): void => {
  fetch('/api/dataset/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dsInfo: {
        datasetComment: addDatasetComment.value,
        isPublic: false,
        ispublished: false
      }
    })
  })
    .then(function (resp) {
      return resp.json();
    })
    .then(function (data) {
      addDatasetComment.value = '';
      datasetsError.value = false;
      datasetsErrorMsg.value = '';
      addDatasetDialogActive.value = false;
      getDatasets();
    })
    .catch(function (err) {
      datasetsError.value = true;
      renderDialog('Dataset Error', 'Please make sure you are logged in, or try again later.');
    });
};

const toggleDialogBox = (): void => {
  dialogBoxActive.value = !dialogBoxActive.value;
};

const renderDialog = (title: string, content: string): void => {
  dialog.value = {
    title,
    content
  };
  toggleDialogBox();
};

const datasetsFiltered = (): void => {
  const userIDValue = userId.value;
  const runAsUserValue = runAsUser.value;
  const filteredDatasets = datasetList.value.filter((i) => {
    if (showMineOnly.value) {
      return i.userID && (i.userID === userIDValue || i.userID === runAsUserValue);
    } else {
      return true;
    }
  });
  if (datasetSearch.value) {
    displayDatasets.value = filteredDatasets.filter((i) => {
      return (`${i.seq || ''}${i.doi || ''}${i.title || ''}${i.datasetComment || ''}`.includes(datasetSearch.value));
    });
  } else {
    displayDatasets.value = filteredDatasets;
  }
};

// Watchers
watch(() => props.datasetOptions, (options) => {
  if (options) {
    overrideOptions(props.datasetOptions);
  }
}, { deep: true });

watch(datasetSearch, () => {
  datasetsFiltered();
});

watch(datasetList, () => {
  datasetsFiltered();
}, { deep: true });

watch(showMineOnly, () => {
  datasetsFiltered();
});

// Lifecycle
onBeforeMount(() => {
  getDatasets();
  overrideOptions(props.datasetOptions);
  datasetsFiltered();
});
</script>

<style scoped>
  .datasets {
  }

  .dataset-header {
    background-color: #03A9F4;
    color: #ffffff;
    font-size: 22px;
    font-weight: bold;
  }

</style>
