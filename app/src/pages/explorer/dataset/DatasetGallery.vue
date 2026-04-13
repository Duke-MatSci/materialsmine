<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner :loading="loading" text="Loading Datasets" />
    </div>
    <div class="utility-roverflow" v-else>
      <div class="utility-roverflow u--margin-toplg">
        <div class="search_box card-icon-container u--margin-toplg">
          <form class="form">
            <div class="search_box_form">
              <div class="form__group search_box_form-item-1">
                <input
                  type="text"
                  ref="search_input"
                  class="form__input form__input--flat"
                  placeholder="Search Datasets"
                  name="search"
                  id="search"
                  required
                  v-model.lazy="searchWord"
                />
                <label htmlFor="search" class="form__label search_box_form_label"
                  >Search Datasets</label
                >
              </div>
            </div>
            <div class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg">
              <!-- <div class="form__field md-field">
              <select class="form__select"
                v-model="filter" name="filter" id="filter">
                <option value="" disabled selected hidden>Filter by...</option>
                <option value="title">Title</option>
                <option value="keyword">Keyword</option>
                <option value="doi">DOI</option>
                <option value="organization">Organization</option>
                <option value="user">Curating User</option>
              </select>
            </div> -->
              <button
                type="submit"
                class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                @click.prevent="submitSearch()"
              >
                Search Datasets
              </button>
              <button
                v-if="searchEnabled"
                type="submit"
                class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                @click.prevent="customReset()"
              >
                Clear Search
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <span v-if="total === 0"> No results </span>
          <span v-else-if="total === 1"> 1 result </span>
          <span v-else> About {{ total }} results </span>
        </span>
      </div>
      <template v-if="!!items && !!items.length">
        <div class="gallery-grid grid grid_col-5">
          <md-card v-for="(result, index) in items" :key="index" class="btn--animated gallery-item">
            <div class="u_gridicon u_gridbg">
              <div v-if="isAuth" @click.prevent="copyDataDictionary(result)">
                <md-icon class="u_color_white" style="font-size: 14px !important">
                  recycling</md-icon
                >
              </div>
              <a download :href="optionalChaining(() => result.distribution)">
                <md-icon class="u_color_white" style="font-size: 14px !important">
                  download</md-icon
                >
              </a>
              <div v-if="isAuth && isAdmin" @click.prevent="editDataset(result)">
                <md-icon class="u_color_white">edit</md-icon>
              </div>
              <div
                v-if="isAuth && isAdmin"
                @click.prevent="renderDialog('Delete Dataset?', 'delete', result, 80)"
              >
                <md-icon class="u_color_white">delete_outline</md-icon>
              </div>
            </div>
            <router-link
              v-if="result.identifier"
              :to="{
                name: 'DatasetVisualizer',
                params: { id: getDatasetId(result) },
              }"
            >
              <md-card-media-cover md-solid>
                <md-card-media v-if="result.thumbnail" md-ratio="4:3">
                  <img :src="result.thumbnail" :alt="result.label" />
                </md-card-media>
                <md-card-media v-else md-ratio="4:3" class="u--bg-grey"> </md-card-media>
                <md-card-area class="u_gridbg">
                  <md-card-header class="u_show_hide">
                    <span class="md-subheading">
                      <strong>{{ result.label }}</strong>
                    </span>
                    <span class="md-body-1">{{ reduceDescription(result.description, 15) }}</span>
                  </md-card-header>
                </md-card-area>
              </md-card-media-cover>
            </router-link>
          </md-card>
        </div>
        <pagination
          :cpage="pageNumber"
          :tpages="totalPages"
          @go-to-page="loadPrevNextImage($event)"
        />
      </template>
      <div
        class="utility-roverflow u_centralize_text u_margin-top-med"
        v-else-if="page > totalPages && totalPages > 0"
      >
        <h3 class="visualize_header-h3 u_margin-top-med">
          Invalid page number,
          <a @click.prevent="loadPrevNextImage(totalPages)">return to page {{ totalPages }}?</a>
        </h3>
      </div>
      <div class="utility-roverflow u_centralize_text u_margin-top-med section_loader" v-else>
        <h1 class="visualize_header-h1 u_margin-top-med">No Datasets Found</h1>
      </div>
    </div>
    <dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>
        <div v-if="dialog.type == 'delete'">
          <md-content v-if="dialog.dataset">
            <div>
              This will permanently remove the dataset
              <b>{{ dialog.dataset.label }}</b>
            </div>
            with identifier <b>{{ dialog.dataset.identifier }}</b> and any associated files.
          </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner :loading="dialogLoading" text="Deleting Chart" />
        </div>
      </template>
      <template v-slot:actions>
        <span v-if="dialog.type == 'delete' && dialog.dataset">
          <md-button @click.prevent="toggleDialogBox"> No, cancel </md-button>
          <md-button @click.prevent="deleteDataset(dialog.dataset)"> Yes, delete. </md-button>
        </span>
        <md-button v-else @click.prevent="toggleDialogBox">Close</md-button>
      </template>
    </dialogbox>
  </div>
</template>

<script setup lang="ts">
// TODO: @tholulomo remove commented sections here
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import spinner from '@/components/Spinner.vue';
import pagination from '@/components/explorer/Pagination.vue';
// import Dialog from '@/components/Dialog.vue';

defineOptions({
  name: 'viz-grid',
});

interface DatasetItem {
  label: string;
  description: string;
  identifier: string;
  thumbnail?: string;
  distribution?: string;
}

interface DialogState {
  title: string;
  type?: string;
  minWidth?: number;
  dataset?: DatasetItem;
}

const store = useStore();
const router = useRouter();
const route = useRoute();

// Data
// const baseUrl = ref<string>(`${window.location.origin}/api/files/`);
const loading = ref<boolean>(true);
const pageNumber = ref<number>(1);
const dialog = ref<DialogState>({
  title: '',
});
const dialogLoading = ref<boolean>(false);
const filter = ref<string>('');
const searchWord = ref<string>('');
const searchEnabled = ref<boolean>(false);
const renderText = ref<string>('');
const pageSize = ref<number>(20);

// Computed
const dialogBoxActive = computed(() => store.getters.dialogBox);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);
const items = computed(() => store.getters['explorer/sddDatasets/getAllDatasets']);
const page = computed(() => store.getters['explorer/sddDatasets/getPage']);
const total = computed(() => store.getters['explorer/sddDatasets/getTotal']);
const totalPages = computed(() => store.getters['explorer/sddDatasets/getTotalPages']);

// Methods from optional-chaining-util mixin
const optionalChaining = <T,>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

// Methods from reducer mixin
const reduceDescription = (args: string, size = 50): string => {
  const arr = args.split(' ');
  arr.splice(size);
  const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '');
  const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${res}...`;
};

// Methods from explorerQueryParams mixin
const checkPageSize = (pageSizeValue: number): void => {
  if (!pageSizeValue || (pageSizeValue && pageSizeValue < 1)) {
    pageSize.value = 20;
  } else if (pageSizeValue && pageSizeValue > 50) {
    pageSize.value = 20;
  } else {
    pageSize.value = pageSizeValue;
  }
};

const updateSearchWord = (searchWordValue: string): void => {
  if (!searchWordValue && !searchWordValue.length) searchEnabled.value = false;
  searchWord.value = searchWordValue;
};

const localSearchMethod = async (): Promise<void> => {
  if (searchEnabled.value) {
    store.dispatch('explorer/sddDatasets/searchDatasetKeyword', {
      searchTerm: searchWord.value,
      page: pageNumber.value,
    });
  } else await loadItems(pageNumber.value);
  loading.value = false;
};

const updateParamsAndCall = async (pushNewRoute = false): Promise<void> => {
  searchEnabled.value = !!searchWord.value;
  if (pushNewRoute) {
    const query: Record<string, any> = {
      page: pageNumber.value,
    };
    if (pageSize.value) {
      query.size = pageSize.value;
    }
    if (searchWord.value) {
      query.q = searchWord.value;
    }
    if (filter.value) {
      query.type = filter.value;
    }
    router.push({ query });
  }
  await localSearchMethod();
};

const loadPrevNextImage = async (event: number): Promise<void> => {
  pageNumber.value = event;
  await updateParamsAndCall(true);
};

const loadParams = async (query: Record<string, any>, performCall = true): Promise<void> => {
  pageNumber.value = parseInt(query.page) ? +query.page : 1;
  if (pageSize.value) {
    parseInt(query.size) ? checkPageSize(+query.size) : checkPageSize(20);
  }
  query.q ? updateSearchWord(query.q) : updateSearchWord('');
  if (performCall) {
    await updateParamsAndCall();
  }
};

const resetSearch = async (type?: string): Promise<void> => {
  renderText.value = `Showing all ${type}`;
  await router.replace({ query: {} });
  return await loadParams({}, false);
};

// Component methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const renderDialog = (title: string, type: string, result: DatasetItem, minWidth: number): void => {
  dialog.value = {
    title,
    type,
    minWidth,
    dataset: result,
  };
  toggleDialogBox();
};

const submitSearch = async (): Promise<void> => {
  searchEnabled.value = !!searchWord.value;
  pageNumber.value = 1;
  return await updateParamsAndCall(true);
};

const customReset = async (type?: string): Promise<void> => {
  filter.value = '';
  searchWord.value = '';
  await resetSearch(type);
};

const deleteDataset = async (dataset: DatasetItem): Promise<void> => {
  if (!isAdmin.value) return; // temporary safeguard
  dialogLoading.value = true;
  await store.dispatch('explorer/curation/deleteEntityNanopub', dataset.identifier);
  await store.dispatch('explorer/curation/deleteEntityES', {
    identifier: dataset.identifier,
    type: 'datasets',
  });
  toggleDialogBox();
  dialogLoading.value = false;
  await loadItems();
};

const copyDataDictionary = async (dataset: DatasetItem): Promise<void> => {
  const distribution = dataset.distribution || '';
  const links = distribution.split(',');
  const xlsLink = links.find((link) => /\.xlsx?/i.test(link.split('?')[0]));

  if (!xlsLink) {
    store.commit('setSnackbar', {
      message: 'No data dictionary found',
      duration: 3000,
    });
    return;
  }

  await navigator.clipboard.writeText(xlsLink.trim());
  store.commit('setSnackbar', {
    message: 'Data dictionary link copied to clipboard',
    duration: 3000,
  });
};

const editDataset = (dataset: DatasetItem): void => {
  router.push(`/explorer/curate/sdd/edit/${getDatasetId(dataset)}`);
};

// const downloadFiles = (item: DatasetItem): void => {
//   if (item.distribution) {
//     fetch(item.distribution);
//   }
// };

const loadItems = async (pageCurrent = 1): Promise<void> => {
  loading.value = true;
  try {
    await store.dispatch('explorer/sddDatasets/loadDatasets', {
      page: pageCurrent,
    });
  } catch (error) {
    store.commit('setSnackbar', {
      message: error || 'Something went wrong',
      action: () => loadItems(pageCurrent),
    });
  } finally {
    loading.value = false;
  }
};

const getDatasetId = (dataset: DatasetItem): string => {
  return dataset.identifier.split('dataset/')[1];
};

// Watchers from explorerQueryParams mixin
watch(
  () => route.query,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      loadParams(newValue);
    }
  }
);

watch(pageSize, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    checkPageSize(newValue);
    updateParamsAndCall(true);
  }
});

// Lifecycle
onMounted(async () => {
  const query = route.query;
  if (query && Object.keys(query).length > 0) {
    await loadParams(query as Record<string, any>);
  } else {
    await loadItems();
  }
});
</script>
