<template>
  <div class="data-selector-wrapper">
    <div class="data-row u_margin-top-small">
      <div
        class="u--layout-flex u_searchimage_input u_centralize_items u--layout-flex-justify-sb"
      >
        <div class="article_metadata_strong md-title">Data</div>
        <!-- Get template button -->
        <a
          href="/2D-Sample-Template.csv"
          download
          class="btn btn--tertiary u--shadow-none u--layout-flex u_centralize_items u--layout-flex-justify-center"
        >
          <span class="md-body-1">Get Template</span>
        </a>
        <!-- Upload button -->
        <div>
          <label for="Viscoelastic_Data">
            <div class="form__file-input">
              <div class="md-theme-default">
                <label
                  class="btn btn--primary u_color_white u--shadow-none"
                  for="Viscoelastic_Data"
                >
                  <span class="md-body-1">Upload file</span>
                </label>
                <div class="md-file">
                  <input
                    @change="onInputChange"
                    accept=".csv, .tsv, .txt"
                    type="file"
                    name="Viscoelastic_Data"
                    id="Viscoelastic_Data"
                  />
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
      <md-table
        class="u_width--max u_divider-fullspan utility-transparentbg viz-u-postion__rel viz-u-zIndex__min"
        :value="fetchedNames"
        md-sort="key"
        md-sort-order="asc"
      >
        <md-table-empty-state md-label="No data available">
        </md-table-empty-state>
        <template #md-table-row="{ item }">
          <md-table-row :key="item.name">
            <md-table-cell md-label="Name" md-sort-by="name">
              <md-chip
                :style="{ 'background-color': item.color, color: 'white' }"
              >
                {{ item.name.split('-').at(-1) }}
              </md-chip>
            </md-table-cell>
            <md-table-cell md-label="Select">
              <md-checkbox
                v-model="selectedValue"
                @change="onSelect"
                :value="item"
              ></md-checkbox>
            </md-table-cell>
          </md-table-row>
        </template>
      </md-table>
      <!-- Dowload button -->
      <div class="u_myprofile u--margin-bottommd">
        <button
          @click.prevent="downloadFile"
          class="utility-gridicon-single btn btn--tertiary u--shadow-none u--layout-flex u_centralize_items u--layout-flex-justify-center u_margin-bottom-small"
        >
          <span class="md-body-1">Download files</span>
        </button>
      </div>
    </div>
    <div v-if="page === 'scatter'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-yaxis-label">Y-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query2Value"
            name="yAxis"
            @change="handleQuery2Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="page === 'hist'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <template v-if="jsonName && (jsonData || !!jsonData.length)">
      <download-csv :data="jsonData" :name="jsonName.split('-').at(-1)">
        <button :ref="jsonName"></button>
      </download-csv>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

interface DataItem {
  name: string;
  color: string;
  [key: string]: any;
}

const store = useStore();
const route = useRoute();
const router = useRouter();

// Data
const columns = ref<string[]>(['C11', 'C12', 'C22', 'C16', 'C26', 'C66']);
const query1Value = ref<string>('C11');
const query2Value = ref<string>('C12');
const selectedValueArr = ref<DataItem[]>([]);
const jsonName = ref<string>('');
const jsonData = ref<any>(null);

// Computed
const activeData = computed(() => store.state.metamineNU.activeData);
const fetchedNames = computed(() => store.state.metamineNU.fetchedNames);
const dataLibrary = computed(() => store.state.metamineNU.dataLibrary);
const page = computed(() => store.state.metamineNU.page);
const query1 = computed(() => store.state.metamineNU.query1);
const query2 = computed(() => store.state.metamineNU.query2);

const selectedValue = computed({
  get() {
    return fetchedNames.value.filter((item: DataItem) =>
      activeData.value.map((data: DataItem) => data.name).includes(item.name)
    );
  },
  set(val: DataItem[]) {
    onSelect(val);
  }
});

const fetchedNamesWithInfo = computed(() => {
  return fetchedNames.value.map((element: any) => {
    element.showDropDown = false;
    return element;
  });
});

const dynamfit = computed(() => store.state.explorer?.dynamfit);

const disableInput = computed(() => {
  return (
    !dynamfit.value?.fileUpload ||
    !dynamfitData.value ||
    !Object.keys(dynamfitData.value).length
  );
});

const dynamfitData = computed(() => {
  return store.getters['explorer/getDynamfitData'];
});

// Methods
const handleQuery1Change = () => {
  changeRouteQuery();
  store.commit('metamineNU/setQuery1', query1Value.value);
};

const handleQuery2Change = () => {
  changeRouteQuery();
  store.commit('metamineNU/setQuery2', query2Value.value);
};

const changeRouteQuery = () => {
  const query = {
    pairwise_query1: query1Value.value,
    pairwise_query2: query2Value.value
  };
  router.push({ query });
};

const onSelect = (items: DataItem[]) => {
  const selected = items;
  fetchedNamesWithInfo.value.map((entry: any, index: number) =>
    items.map((item: any) => item.key).includes(index)
      ? (entry.showDropDown = true)
      : (entry.showDropDown = false)
  );
  const unselected = fetchedNames.value.filter(
    (item: DataItem) => !selected.includes(item)
  );
  selected.map((dataNameObj: DataItem) => {
    let sourceItems = activeData.value;
    let destItems = dataLibrary.value;
    const checked = destItems.filter(
      (item: DataItem) => item.name === dataNameObj.name
    );
    destItems = destItems.filter((item: DataItem) => item.name !== dataNameObj.name);
    sourceItems = [...sourceItems, ...checked];
    store.commit('metamineNU/setActiveData', sourceItems);
    store.commit('metamineNU/setDataLibrary', destItems);
  });
  unselected.map((dataNameObj: DataItem) => {
    let sourceItems = dataLibrary.value;
    let destItems = activeData.value;
    const unchecked = destItems.filter(
      (item: DataItem) => item.name === dataNameObj.name
    );
    destItems = destItems.filter((item: DataItem) => item.name !== dataNameObj.name);
    sourceItems = [...sourceItems, ...unchecked];
    store.commit('metamineNU/setActiveData', destItems);
    store.commit('metamineNU/setDataLibrary', sourceItems);
  });
};

const onInputChange = async (e: Event) => {
  displayInfo('Uploading File...');
  const target = e.target as HTMLInputElement;
  const file = target?.files ? [...target.files] : [];
  const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain'];
  try {
    const extension = file[0]?.type?.replace(/(.*)\//g, '');
    if (!extension || !allowedTypes.includes(extension)) {
      return displayInfo('Unsupported file format');
    }
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isVisualizationCSV: true
    });
    if (fileName) {
      displayInfo('Upload Successful', 1500);
      store.commit('metamineNU/setLoadingState', true);
      await nextTick();
      setTimeout(async () => {
        store.commit('metamineNU/setRefreshStatus', true);
        await store.dispatch('metamineNU/fetchMetamineDataset');
      }, 500);
    }
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => onInputChange(e)
    });
  } finally {
    target.value = '';
  }
};

const displayInfo = (msg: string, duration?: number) => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000
    });
  }
};

const downloadFile = async () => {
  const rawJson = store.getters['metamineNU/getRawJson'];
  if (!rawJson) return;
  for (let i = 0; i < selectedValue.value.length; i++) {
    const name = selectedValue.value[i].name;
    jsonName.value = name;
    jsonData.value = rawJson[name];
    await nextTick();
    if (jsonData.value) {
      const elem = (jsonName.value as any) as HTMLButtonElement;
      await elem.click();
      elem.dispatchEvent(new Event('click'));
      await nextTick();
    }
    jsonName.value = '';
    jsonData.value = null;
  }
};

// Lifecycle
onMounted(() => {
  query1Value.value = query1.value
    ? query1.value
    : (route.query.pairwise_query1 as string);
  query2Value.value = query2.value
    ? query2.value
    : (route.query.pairwise_query2 as string);
  store.commit('metamineNU/setQuery1', route.query.pairwise_query1);
  store.commit('metamineNU/setQuery2', route.query.pairwise_query2);
  selectedValueArr.value = activeData.value;
});
</script>

<script lang="ts">
import { defineComponent } from 'vue';
import JsonCSV from 'vue-json-csv';

export default defineComponent({
  name: 'DataSelector',
  components: {
    downloadCsv: JsonCSV
  }
});
</script>
