<template>
  <div>
    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-body-1">
            Administrators can manage curations. Accepted actions include delete, approve, and update curated samples status
          </div>
        </div>
      </div>

    </div>
    <search-gallery :isEmpty="isEmpty" :totalItems="xmlFinder?.totalItems || 0" :loading="loading" :error="!!error"
      :dense="true">
      <template #search_input>
        <input type="text" ref="search_input" class="form__input form__input--flat" placeholder="Search XML" name="search"
          id="search" required v-model="searchWord" />
      </template>

      <template  #filter_inputs>
        <div v-if="selectedFilters.includes('apprStatus')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" md-deletable @md-delete="removeChip('apprStatus')" >
            Admin Approval Status: {{ apprStatus  }}</md-chip>
        </div>

        <div v-if="selectedFilters.includes('curationState')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" @md-delete="removeChip('curationState')" md-deletable>Curation State: {{ curationState }}</md-chip>
        </div>

        <div v-if="selectedFilters.includes('isNew')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" @md-delete="removeChip('isNew')" md-deletable="">is New: {{ isNew }}</md-chip>
        </div>

        <md-field v-if="selectedFilters.includes('user')" style="max-width: 100%;">
          <label>Curating User</label>
          <md-input v-model="user"></md-input>
        </md-field>
      </template>

      <template #action_buttons>
        <div class="form__field md-field">
          <select @change="(e) => selectFilters(e)" class="form__select" name="filterBy" id="filterBy">
            <option value="" disabled selected>Filter by...</option>
            <option value="apprStatus::Approved">Admin Approval Status (Approved)</option>
            <option value="apprStatus::Not_Approved">Admin Approval Status (Not_Approved)</option>
            <option value="curationState::Edit">Editing State</option>
            <option value="curationState::Review">Reviewing State</option>
            <option value="curationState::Curated">Curated</option>
            <option value="user">Curating User</option>
            <option value="isNew::Yes">New curation</option>
            <option value="isNew::No">Old Curation</option>
          </select>
        </div>
        <button
          type="submit"
          class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
          @click.prevent="submitSearch"
        >
        Search Xml
        </button>
        <button v-if="searchEnabled"
          type="submit"
          class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
          @click.prevent="customReset('XML')"
        >
        Clear Search
        </button>
      </template>

      <template #page_input>
        <input type="number" id="pagesize" class="u_width--xs utility-navfont" name="pagesize" v-model.lazy="pageSize"
          min="1" max="20">
      </template>

      <template v-if="!!Object.keys(xmlFinder || {}).length && !!xmlFinder?.xmlData?.length && !error">
        <md-card v-for="(xml, index) in xmlFinder.xmlData" :key="index" class="btn--animated gallery-item viz-u-mgup-md u_margin-none">
          <router-link
            :to="{ name: 'XmlVisualizer', params: { id: xml.id }, query: { isNewCuration: `${xml.isNewCuration}` } }">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <md-icon class="u--color-primary md-size-3x">code_off</md-icon>
              </md-card-media>
              <md-card-area class="u_gridbg">
                <div class="md-card-actions u_show_hide viz-u-display__show">
                  <span class="md-body-2">{{ xml.title || '' }} </span>
                  <span class="md-body-1">Click to view</span>
                </div>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </template>

      <template #pagination>
        <pagination v-if="xmlFinder && xmlFinder.xmlData" :cpage="pageNumber" :tpages="xmlFinder.totalPages || 1"
          @go-to-page="loadPrevNextImage($event)" />
      </template>

      <template #errorMessage>{{ !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found' }}</template>

    </search-gallery>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useQuery } from '@vue/apollo-composable';
import pagination from '@/components/explorer/Pagination.vue';
import { XML_FINDER } from '@/modules/gql/xml-gql';
import { useExplorerQueryParams } from '@/composables';
import SearchGallery from '@/components/XmlSearchUtil.vue';

// Store
const store = useStore();
const route = useRoute();

// Data
const baseUrl = ref(window.location.origin);
const renderText = ref('Showing all XML');
const selectedFilters = ref<string[]>([]);
const apprStatus = ref<string | null>(null);
const curationState = ref<string | null>(null);
const user = ref<string | null>(null);
const isNew = ref<string | null>(null);
const filterParams = ref<Record<string, any>>({});
const error = ref<string | null>(null);

// Placeholder ref for Apollo query (will be assigned from composable)
const pageNumber = ref<number>(1);
const pageSize = ref<number>(20);

// Apollo Query setup - uses refs that will be synced with composable
const { result, loading, refetch, onError, onResult } = useQuery(
  XML_FINDER,
  () => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: parseInt(pageSize.value.toString()),
      filter: { param: route.query?.q, ...filterParams.value }
    }
  }),
  {
    fetchPolicy: 'cache-and-network'
  }
);

// Computed
const xmlFinder = computed(() => result.value?.xmlFinder || {});

const isEmpty = computed(() => {
  if (!xmlFinder.value || xmlFinder.value.length === 0 || !Object.keys(xmlFinder.value).length || xmlFinder.value.totalItems === 0) return true;
  return false;
});

const filtersActive = computed(() => {
  return !!apprStatus.value || !!curationState.value || !!user.value || (isNew.value !== null);
});

// Local search method for query params composable
const localSearchMethod = async (): Promise<void> => {
  const params: Record<string, any> = {
    isNewCuration: selectedFilters.value.includes('isNew') ? isNew.value === 'Yes' : null,
    status: apprStatus.value,
    curationState: curationState.value,
    user: user.value
  };

  for (const key in params) {
    if (params[key] === null) delete params[key];
  }

  filterParams.value = params;
  await refetch();
};

// Composable
const {
  pageNumber: composablePageNumber,
  pageSize: composablePageSize,
  searchWord,
  searchEnabled,
  loadParams,
  updateParamsAndCall,
  loadPrevNextImage,
  resetSearch
} = useExplorerQueryParams({
  localSearchMethod,
  hasPageSize: true
});

// Sync composable refs with local refs used in Apollo query
watch(composablePageNumber, (newVal) => {
  pageNumber.value = newVal;
});

watch(composablePageSize, (newVal) => {
  pageSize.value = newVal;
});

const submitSearch = async () => {
  if (!searchWord.value && !filtersActive.value) {
    return store.commit('setSnackbar', {
      message: 'Enter a XML sample file name  or select a filter type',
      duration: 10000
    });
  }
  error.value = null;
  searchEnabled.value = !!searchWord.value || !!filtersActive.value;
  pageNumber.value = 1;
  return await updateParamsAndCall(true);
};

const customReset = async (type: string) => {
  apprStatus.value = null;
  curationState.value = null;
  user.value = null;
  isNew.value = null;
  selectedFilters.value = [];
  filterParams.value = {};
  error.value = null;
  await resetSearch(type);
};

const selectFilters = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const value = target.value;
  const arrValue = value.split('::');

  if (!selectedFilters.value.includes(arrValue[0])) {
    selectedFilters.value.push(arrValue[0]);
  }

  if (arrValue[0] === 'apprStatus') {
    apprStatus.value = arrValue[1] || null;
  } else if (arrValue[0] === 'curationState') {
    curationState.value = arrValue[1] || null;
  } else if (arrValue[0] === 'user') {
    user.value = arrValue[1] || null;
  } else if (arrValue[0] === 'isNew') {
    isNew.value = arrValue[1] || null;
  }

  target.value = '';
};

const removeChip = (str: string) => {
  const index = selectedFilters.value.indexOf(str);
  if (index < 0) return;
  selectedFilters.value.splice(index, 1);

  if (str === 'apprStatus') {
    apprStatus.value = null;
  } else if (str === 'curationState') {
    curationState.value = null;
  } else if (str === 'user') {
    user.value = null;
  } else if (str === 'isNew') {
    isNew.value = null;
  }
};

// Apollo Error Handler
onError((err) => {
  if (err.networkError) {
    const networkErr = err.networkError as any;
    error.value = `Network Error: ${networkErr?.response?.status} ${networkErr?.response?.statusText}`;
  } else if (err.graphQLErrors) {
    error.value = err.graphQLErrors.toString();
  }
  store.commit('setSnackbar', {
    message: error.value,
    duration: 10000
  });
});

// Apollo Result Handler
onResult(({ data, loading: isLoading }) => {
  if (!isLoading && data) error.value = null;
});

// Watch for filter/search changes
watch([apprStatus, curationState, user, isNew], async () => {
  await localSearchMethod();
});

// Lifecycle
onMounted(() => {
  store.commit('setAppHeaderInfo', { icon: '', name: 'Manage Curation' });
  const query = route.query;
  if (query?.page || query?.size || query?.q) {
    loadParams(route.query);
  }
});
</script>
