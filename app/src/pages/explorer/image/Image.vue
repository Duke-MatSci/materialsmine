<template>
  <div class="gallery">
    <div class="utility-roverflow u--margin-toplg">
      <div class="search_box card-icon-container u--margin-toplg">
        <form class="form" @submit.prevent="submitSearch">
          <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
              <input
                type="text"
                ref="search_input"
                class="form__input form__input--flat"
                placeholder="Search Microstructure Image"
                name="search"
                id="search"
                required
                v-model.lazy="searchWord"
              />
              <label htmlFor="search" class="form__label search_box_form_label"
                >Search Microstructure Image</label
              >
            </div>
          </div>
          <div class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg">
            <div class="form__field md-field">
              <select class="form__select" v-model="filter" name="filter" id="filter">
                <option value="" disabled selected hidden>Filter by...</option>
                <option value="Keyword">Keyword</option>
                <option value="filterByFiller">Filler</option>
                <option value="filterByYear">Year</option>
                <option value="filterByDOI">DOI</option>
                <option value="filterByMicroscopy">Microscopy</option>
                <option value="filterByID">Sample ID</option>
              </select>
            </div>
            <button
              type="submit"
              class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
              @click.prevent="submitSearch()"
            >
              Search Images
            </button>
            <button
              v-if="searchEnabled"
              type="submit"
              class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
              @click.prevent="clearForm()"
            >
              Clear Search
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="utility-roverflow">
      <div class="u_content__result u_margin-top-small">
        <span v-if="!loading" class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="renderText != null">{{ renderText }}</strong>
          <span v-if="currentTotalItems === 0"> No results </span>
          <span v-else-if="currentTotalItems === 1"> 1 result </span>
          <span v-else> About {{ currentTotalItems }} results </span>
          <span class="utility-absolute-input">
            <label for="pagesize"><strong>Page size:</strong></label>
            <input
              placeholder="Enter page size"
              type="number"
              id="pagesize"
              class="u_width--xs utility-navfont"
              name="pagesize"
              title="specify number of items per size"
              v-model.lazy="pageSize"
              min="1"
              max="20"
            />
          </span>
        </span>
      </div>
      <template v-if="!searchImagesEmpty || !imagesEmpty">
        <div class="gallery-grid grid grid_col-5">
          <md-card
            v-for="(image, index) in currentImages"
            :key="index"
            class="btn--animated gallery-item"
          >
            <router-link
              :to="{
                name: 'ImageDetailView',
                params: { id: image.metaData.id, fileId: image.file },
              }"
            >
              <md-card-media-cover md-solid>
                <md-card-media md-ratio="4:3">
                  <img :src="baseUrl + image.file" :alt="image.metaData.title" />
                </md-card-media>
                <md-card-area class="u_gridbg">
                  <md-card-header class="u_show_hide">
                    <span class="md-subheading">
                      <strong>{{
                        reduceDescription(image.description || 'polymer nanocomposite', 2)
                      }}</strong>
                    </span>
                    <span class="md-body-1">{{
                      reduceDescription(image.metaData.title || 'polymer nanocomposite', 15)
                    }}</span>
                  </md-card-header>
                </md-card-area>
              </md-card-media-cover>
            </router-link>
          </md-card>
        </div>
        <pagination
          :cpage="pageNumber"
          :tpages="searchImages.totalPages || images.totalPages"
          @go-to-page="loadPrevNextImage($event)"
        />
      </template>
    </div>
    <div class="u--margin-toplg" v-if="loading">
      <Spinner :loading="loading" text="Loading Images" />
    </div>
    <div
      v-else-if="!!error || !!isEmpty"
      class="utility-roverflow u_centralize_text u_margin-top-med"
    >
      <h1 class="visualize_header-h1 u_margin-top-med">
        {{ !!error ? 'Cannot Load Images' : 'Sorry! No Image Found' }}
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onActivated, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useQuery } from '@vue/apollo-composable';
import { IMAGES_QUERY, SEARCH_IMAGES_QUERY } from '@/modules/gql/image-gql';
import { useReduce } from '@/composables/useReduce';
import { useExplorerQueryParams } from '@/composables/useExplorerQueryParams';
import Spinner from '@/components/Spinner.vue';
import Pagination from '@/components/explorer/Pagination.vue';

// Component name for debugging
defineOptions({
  name: 'ImageGallery',
});

// Constants
const DPS = 20; // Default page size
const DPN = 1; // Default page number
const DEFAULT_RESPONSE = {
  images: [],
  totalItems: 0,
  pageSize: 0,
  pageNumber: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

// Route and router
const route = useRoute();
const router = useRouter();
const store = useStore();

// Composables
const { reduceDescription } = useReduce();

// TypeScript interfaces
interface ImagesResponse {
  totalItems: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  images: any[];
}

// Reactive data
const baseUrl = ref(window.location.origin);
const renderText = ref('Showing all images');
const images = ref<ImagesResponse>(DEFAULT_RESPONSE);
const searchImages = ref<ImagesResponse>(DEFAULT_RESPONSE);
const pageNumber = ref(parseInt(route.query.page as string) || DPN);
const pageSize = ref(Math.min(parseInt(route.query.size as string) || DPS, DPS));
const searchEnabled = ref(false);
const filter = ref('');
const searchWord = ref('');
const error = ref<string | null>(null);
const imagesLoading = ref(false);
const loading = ref(false);

// Computed properties
const imageSearch = computed(() => store.getters['explorer/getSelectedFacetFilterMaterialsValue']);

const searchImagesEmpty = computed(() => {
  return !searchImages.value.images?.length || searchImages.value.totalItems === 0;
});

const imagesEmpty = computed(() => {
  return !images.value.images?.length || images.value.totalItems === 0;
});

const isEmpty = computed(() => {
  return (
    (imagesEmpty.value && !searchEnabled.value) || (searchImagesEmpty.value && searchEnabled.value)
  );
});

const currentImages = computed(() => {
  return searchEnabled.value ? searchImages.value.images : images.value.images;
});

const currentTotalItems = computed(() => {
  return searchEnabled.value ? searchImages.value.totalItems : images.value.totalItems;
});

// GraphQL queries
// Use enabled instead of skip for better control
const { result: imagesResult, refetch: refetchImages } = useQuery(
  IMAGES_QUERY,
  {
    input: {
      pageNumber: pageNumber.value,
      pageSize: parseInt(imageSearch.value?.size) || pageSize.value,
    },
  },
  {
    enabled: !searchEnabled.value,
    fetchPolicy: 'cache-and-network',
  }
);

const {
  result: searchImagesResult,
  loading: searchImagesLoading,
  refetch: refetchSearchImages,
} = useQuery(
  SEARCH_IMAGES_QUERY,
  () => ({
    input: {
      search: imageSearch.value?.type,
      searchValue: imageSearch.value?.value,
      pageNumber: pageNumber.value,
      pageSize: parseInt(imageSearch.value?.size) || pageSize.value,
    },
  }),
  () => ({
    enabled: searchEnabled.value,
    fetchPolicy: 'network-only',
  })
);

// Watch for query results
watchEffect(() => {
  if (imagesResult.value?.images) {
    images.value = imagesResult.value.images;
  }
});

watchEffect(() => {
  if (searchImagesResult.value?.searchImages) {
    searchImages.value = searchImagesResult.value.searchImages;
  }
});

// Watch for loading state
watch([imagesLoading, searchImagesLoading], ([imagesLoad, searchLoad]) => {
  loading.value = imagesLoad || searchLoad;
});

// Methods
const refetchTrigger = async (args?: { input: { pageNumber: number; pageSize: number } }) => {
  imagesLoading.value = true;
  try {
    args ? await refetchImages(args) : await refetchImages();
  } finally {
    imagesLoading.value = false;
  }
};

const localSearchMethod = async (): Promise<void> => {
  error.value = null;
  if (searchEnabled.value) {
    await refetchSearchImages();
  } else {
    await refetchTrigger({
      input: {
        pageNumber: pageNumber.value,
        pageSize: parseInt(imageSearch.value?.size) || pageSize.value,
      },
    });
  }
};

// Setup useExplorerQueryParams with localSearchMethod
const {
  pageNumber: composablePageNumber,
  pageSize: composablePageSize,
  loadPrevNextImage,
  updateParamsAndCall,
  checkPageSize: checkPageSizeFromComposable,
} = useExplorerQueryParams({
  localSearchMethod,
  hasPageSize: true,
});

// Sync composable refs with local refs used in Apollo queries
watch(composablePageNumber, (newVal) => {
  pageNumber.value = newVal;
});

watch(composablePageSize, (newVal) => {
  pageSize.value = newVal;
});

// Watch for imageSearch changes from store
watch(imageSearch, async (newValue) => {
  if (newValue?.value?.length) {
    renderText.value = `Showing ${newValue.type}: ${newValue.value}`;
    searchEnabled.value = true;
    pageSize.value = newValue.pageSize || pageSize.value;
    await nextTick();
    await localSearchMethod();
  } else {
    renderText.value = 'Showing all images';
    searchEnabled.value = false;
    pageSize.value = newValue?.pageSize || pageSize.value;
    await nextTick();
    await localSearchMethod();
  }
});

const submitSearch = async () => {
  if (!searchWord.value || !filter.value) {
    return store.commit('setSnackbar', {
      message: 'Enter a search term and select a filter type',
      duration: 10000,
    });
  }
  pageNumber.value = 1;
  dispatchSearch();
  return await updateParamsAndCall(true);
};

const dispatchSearch = () =>
  store.commit('explorer/setSelectedFacetFilterMaterialsValue', {
    type: filter.value,
    value: searchWord.value,
    size: pageSize.value,
  });

const clearForm = () => {
  searchImages.value = DEFAULT_RESPONSE;
  filter.value = '';
  searchWord.value = '';
  searchEnabled.value = false;
  pageNumber.value = DPN;
  pageSize.value = DPS;
  router.replace({ query: {} });
  dispatchSearch();
};

// Initialize component state based on route and store
const initializeGallery = async () => {
  if (route.query.pageSize) {
    checkPageSizeFromComposable(parseInt(route.query.pageSize as string));
  }

  if (route.query.q && route.query.type) {
    searchWord.value = route.query.q as string;
    filter.value = route.query.type as string;
    searchEnabled.value = true;
    dispatchSearch();
  } else if (imageSearch.value?.value) {
    filter.value = imageSearch.value.type;
    searchWord.value = imageSearch.value.value;
    searchEnabled.value = true;
    await localSearchMethod();
  } else {
    searchEnabled.value = false;
    await refetchTrigger();
  }
};

// Lifecycle hooks
onMounted(() => {
  initializeGallery();
});

// Refetch data when component is activated (e.g., when navigating back from detail view)
onActivated(() => {
  initializeGallery();
});
</script>
