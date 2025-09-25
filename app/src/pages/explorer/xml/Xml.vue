<template>
  <!-- @ts-ignore -->
  <SearchGallery
    :isEmpty="isEmpty"
    :totalItems="xmlFinder.totalItems || 0"
    :loading="loading"
    :error="!!error"
  >
    <!-- @ts-ignore -->
    <template v-slot:search_input>
      <input
        type="text"
        ref="search_input"
        class="form__input form__input--flat"
        placeholder="Search XML"
        name="search"
        id="search"
        required
        v-model="searchWord"
      />
    </template>

    <!-- @ts-ignore -->
    <template v-slot:filter_inputs>
      <div v-if="selectedFilters.includes('apprStatus')" class="u--margin-rightsm">
        <md-chip
          class="u--bg u_margin-bottom-small"
          md-deletable
          @md-delete="removeChip('apprStatus')"
        >
          Admin Approval Status: {{ apprStatus }}
        </md-chip>
      </div>

      <div v-if="selectedFilters.includes('curationState')" class="u--margin-rightsm">
        <md-chip
          class="u--bg u_margin-bottom-small"
          @md-delete="removeChip('curationState')"
          md-deletable
          >Curation State: {{ curationState }}</md-chip
        >
      </div>

      <div v-if="selectedFilters.includes('isNew')" class="u--margin-rightsm">
        <md-chip
          class="u--bg u_margin-bottom-small"
          @md-delete="removeChip('isNew')"
          md-deletable=""
          >is New: {{ isNew }}</md-chip
        >
      </div>

      <md-field v-if="selectedFilters.includes('user')" style="max-width: 100%">
        <label>Curating User</label>
        <md-input v-model="user"></md-input>
      </md-field>
      <md-field v-if="selectedFilters.includes('author')" style="max-width: 100%">
        <label>Author</label>
        <md-input v-model="author"></md-input>
      </md-field>
    </template>

    <!-- @ts-ignore -->
    <template v-slot:action_buttons>
      <div class="form__field md-field">
        <select
          @change="(e) => selectFilters(e)"
          class="form__select"
          name="filterBy"
          id="filterBy"
        >
          <option value="" disabled selected>Filter by...</option>
          <option value="apprStatus::Approved">Admin Approval Status (Approved)</option>
          <option value="apprStatus::Not_Approved">Admin Approval Status (Not_Approved)</option>
          <option value="curationState::Edit">Editing State</option>
          <option value="curationState::Review">Reviewing State</option>
          <option value="curationState::Curated">Curated</option>
          <option value="author">Author</option>
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
      <button
        v-if="searchEnabled"
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="customReset('XML')"
      >
        Clear Search
      </button>
    </template>

    <!-- @ts-ignore -->
    <template v-slot:page_input>
      <input
        type="number"
        id="pagesize"
        class="u_width--xs utility-navfont"
        name="pagesize"
        v-model.lazy="pageSize"
        min="1"
        max="20"
      />
    </template>

    <template v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length && !error">
      <md-card
        v-for="(xml, index) in xmlFinder.xmlData"
        :key="index"
        class="btn--animated gallery-item"
      >
        <div class="u_gridicon">
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="editCuration(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Edit Curation</md-tooltip>
            <md-icon>edit</md-icon>
          </div>
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="duplicateCuration(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Duplicate Curation</md-tooltip>
            <md-icon>content_copy</md-icon>
          </div>
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="openDialogBox(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Delete Curation</md-tooltip>
            <md-icon>delete</md-icon>
          </div>
        </div>
        <router-link
          :to="{
            name: 'XmlVisualizer',
            params: { id: xml.id },
            query: { isNewCuration: xml.isNewCuration },
          }"
        >
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3">
              <md-icon class="explorer_page-nav-card_icon u_margin-top-small">code_off</md-icon>
            </md-card-media>
            <md-card-area class="u_gridbg">
              <md-card-header class="u_show_hide">
                <span class="md-subheading">
                  <strong>{{ xml.title || xml.id || '' }}</strong>
                </span>
                <span class="md-body-1">Click to view</span>
              </md-card-header>
            </md-card-area>
          </md-card-media-cover>
        </router-link>
      </md-card>
    </template>

    <!-- Dialog Box -->
    <Dialog v-if="dialogBoxActive" :minWidth="40" :active="dialogBoxActive">
      <template v-slot:title>Delete Curation</template>
      <template v-slot:content
        >Are you sure? This action would permanently remove this curation from our server.</template
      >
      <template v-slot:actions>
        <md-button @click.prevent="closeDialogBox">Cancel</md-button>
        <md-button @click.prevent="confirmAction">Delete</md-button>
      </template>
    </Dialog>

    <!-- @ts-ignore -->
    <template v-slot:pagination>
      <Pagination
        v-if="xmlFinder && xmlFinder.xmlData"
        :cpage="pageNumber"
        :tpages="xmlFinder.totalPages || 1"
        @go-to-page="loadPrevNextImage($event)"
      />
    </template>

    <!-- @ts-ignore -->
    <template v-slot:errorMessage>{{
      !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found'
    }}</template>
  </SearchGallery>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { XML_FINDER } from '@/modules/gql/xml-gql';
import { useExplorerQueryParams } from '@/composables/useExplorerQueryParams';
import SearchGallery from '@/components/XmlSearchUtil.vue';
import Pagination from '@/components/explorer/Pagination.vue';
import Dialog from '@/components/Dialog.vue';

// Type declaration for SearchGallery component
declare module '@/components/XmlSearchUtil.vue' {
  interface SearchGallery {
    $slots: {
      search_input: any;
      filter_inputs: any;
      action_buttons: any;
      page_input: any;
      pagination: any;
      errorMessage: any;
      default: any;
    };
  }
}

// Component name for debugging
defineOptions({
  name: 'XmlGallery',
});

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Composables
const { updateParamsAndCall, resetSearch, loadParams } = useExplorerQueryParams();

// Reactive data
const baseUrl = ref(window.location.origin);
const renderText = ref('Showing all XML');
const xmlFinder = ref<any>([]);
const pageNumber = ref(1);
const pageSize = ref(20);
const searchEnabled = ref(false);
const searchWord = ref('');
const selectedFilters = ref<string[]>([]);
const apprStatus = ref<string | null>(null);
const curationState = ref<string | null>(null);
const user = ref<string | null>(null);
const author = ref<string | null>(null);
const isNew = ref<string | null>(null);
const filterParams = ref<any>({});
const error = ref<string | null>(null);
const dialogBoxAction = ref<(() => void) | null>(null);

// Computed properties
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);
const userId = computed(() => store.getters['auth/userId']);
const dialogBoxActive = computed(() => store.getters['dialogBox']);

const isEmpty = computed(() => {
  if (
    xmlFinder.value.length === 0 ||
    !Object.keys(xmlFinder.value).length ||
    xmlFinder.value.totalItems === 0
  ) {
    return true;
  }
  return false;
});

const filtersActive = computed(() => {
  return (
    !!apprStatus.value || !!curationState.value || !!user.value || !!isNew.value || !!author.value
  );
});

// GraphQL query
const { result, loading, refetch } = useQuery(
  XML_FINDER,
  () => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: parseInt(pageSize.value.toString()),
      filter: { param: route.query?.q, ...filterParams.value },
    },
  }),
  () => ({
    fetchPolicy: 'cache-first',
  })
);

// Watch for query results
watch(result, (newResult) => {
  if (newResult?.xmlFinder) {
    xmlFinder.value = newResult.xmlFinder;
    if (!loading.value) {
      error.value = null;
    }
  }
});

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const closeDialogBox = () => {
  if (dialogBoxActive.value) {
    toggleDialogBox();
  }
  dialogBoxAction.value = null;
};

const openDialogBox = (id: string, isNew: boolean, func: (() => void) | null = null) => {
  if (!id) return;
  dialogBoxAction.value = !func ? () => deleteXmlCuration(id, isNew) : func;
  if (!dialogBoxActive.value) {
    toggleDialogBox();
  }
};

const confirmAction = () => {
  if (dialogBoxAction.value) {
    dialogBoxAction.value();
    closeDialogBox();
  }
};

const isAuthorized = (xmlUser: string) => {
  return isAuth.value && (xmlUser === userId.value || isAdmin.value);
};

const localSearchMethod = async () => {
  // TODO @aswallace: Update to user query params instead
  const filterParamsObj = {
    isNewCuration: selectedFilters.value.includes('isNew') ? isNew.value === 'Yes' : null,
    status: apprStatus.value,
    curationState: curationState.value,
    user: user.value,
    author: author.value,
  };
  for (const key in filterParamsObj) {
    if ((filterParamsObj as any)[key] === null) delete (filterParamsObj as any)[key];
  }
  filterParams.value = filterParamsObj;
  await refetch();
};

const submitSearch = async () => {
  if (!searchWord.value && !filtersActive.value) {
    return store.commit('setSnackbar', {
      message: 'Enter a XML sample file name or select a filter type',
      duration: 10000,
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
  author.value = null;
  selectedFilters.value = [];
  filterParams.value = {};
  error.value = null;
  await resetSearch(type);
};

const editCuration = (id: string, isNew: boolean) => {
  router.push({
    name: 'EditXmlCuration',
    query: { isNew: isNew.toString(), id },
  });
};

const selectFilters = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const value = target.value;
  const arrValue = value.split('::');
  if (!selectedFilters.value.includes(arrValue[0])) {
    selectedFilters.value.push(arrValue[0]);
  }
  (this as any)[arrValue[0]] = arrValue[1] && arrValue[1];
  target.value = '';
};

const removeChip = (str: string) => {
  const index = selectedFilters.value.indexOf(str);
  if (index < 0) return;
  selectedFilters.value.splice(index, 1); // 2nd parameter means remove one item only
  (this as any)[str] = null;
};

const deleteXmlCuration = async (id: string, isNew: boolean | null = null) => {
  if (id && isNew !== null) {
    await store.dispatch('explorer/curation/deleteCuration', {
      xmlId: id,
      isNew: isNew,
    });
    return await refetch();
  }
};

const duplicateCuration = async (id: string, isNew: boolean) => {
  const response = await store.dispatch('explorer/duplicateXml', {
    id,
    isNew,
  });
  if (response?.id) {
    editCuration(response.id, response.isNew);
  }
};

const loadPrevNextImage = (event: number) => {
  pageNumber.value = event;
  localSearchMethod();
};

// Error handling
const handleError = (error: any) => {
  if (error.networkError) {
    const err = error.networkError;
    error.value = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`;
  } else if (error.graphQLErrors) {
    error.value = error.graphQLErrors;
  }
  store.commit('setSnackbar', {
    message: error.value,
    duration: 10000,
  });
};

// Lifecycle
onMounted(() => {
  const query = route.query;
  if (query?.page || query?.size || query?.q) {
    return loadParams(route.query);
  }
});
</script>
