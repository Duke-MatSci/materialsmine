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
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="renderText != null">{{ renderText }}</strong>
          <span v-if="searchImages.totalItems === 0 || images.totalItems === 0"> No results </span>
          <span v-else-if="searchImages.totalItems === 1 || images.totalItems === 1">
            1 result
          </span>
          <span v-else> About {{ searchImages.totalItems || images.totalItems }} results </span>
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
            v-for="(image, index) in searchImages.images || images.images"
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
import { ref, computed, watch, onMounted } from 'vue';
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

// Route and router
const route = useRoute();
const router = useRouter();
const store = useStore();

// Composables
const { reduceDescription } = useReduce();
const { updateParamsAndCall, resetSearch, checkPageSize } = useExplorerQueryParams();

// Reactive data
const baseUrl = ref(window.location.origin);
const renderText = ref('Showing all images');
const images = ref<any>([]);
const searchImages = ref<any>([]);
const ImageList = ref<any>([]);
const pageNumber = ref(parseInt(route.query.page as string) || 1);
const pageSize = ref(
  parseInt(route.query.size as string) <= 20 ? parseInt(route.query.size as string) : 20
);
const searchEnabled = ref(false);
const filter = ref('');
const searchWord = ref('');
const error = ref<string | null>(null);
const loading = ref(false);

// Computed properties
const imageSearch = computed(() => store.getters['explorer/getSelectedFacetFilterMaterialsValue']);

// This is a WIP TODO (@Tolu) Update later
const searchImagesEmpty = computed(() => {
  return searchImages.value.length === 0 || searchImages.value?.totalItems === 0;
});

const imagesEmpty = computed(() => {
  if (!Object.keys(images.value)?.length || images.value.totalItems === 0) return true;
  return false;
});

const isEmpty = computed(() => {
  return (
    (imagesEmpty.value && !searchEnabled.value) || (searchImagesEmpty.value && searchEnabled.value)
  );
});

// GraphQL queries
const {
  result: imagesResult,
  loading: imagesLoading,
  refetch: refetchImages,
} = useQuery(
  IMAGES_QUERY,
  () => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: parseInt(imageSearch.value?.size) || pageSize.value,
    },
  }),
  () => ({
    skip: searchEnabled.value,
    fetchPolicy: 'cache-first',
  })
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
    skip: !searchEnabled.value,
    fetchPolicy: 'network-only',
  })
);

// Watch for query results
watch(imagesResult, (newResult) => {
  if (newResult?.images) {
    images.value = newResult.images;
  }
});

watch(searchImagesResult, (newResult) => {
  if (newResult?.searchImages) {
    searchImages.value = newResult.searchImages;
  }
});

// Watch for loading state
watch([imagesLoading, searchImagesLoading], ([imagesLoad, searchLoad]) => {
  loading.value = imagesLoad || searchLoad;
});

// Watch for imageSearch changes
watch(imageSearch, (newValue, oldValues) => {
  if (newValue && newValue.value?.length) {
    renderText.value = `Showing ${newValue.type}: ${newValue.value}`;
    searchEnabled.value = true;
    pageSize.value = newValue.pageSize || pageSize.value;
    return localSearchMethod();
  } else {
    searchEnabled.value = false;
    pageSize.value = newValue.pageSize || pageSize.value;
    return localSearchMethod();
  }
});

// Methods
const localSearchMethod = () => {
  error.value = '';
  if (searchEnabled.value) {
    refetchSearchImages();
  } else {
    refetchImages();
  }
};

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

const dispatchSearch = async () => {
  await store.commit('explorer/setSelectedFacetFilterMaterialsValue', {
    type: filter.value,
    value: searchWord.value,
    size: pageSize.value,
  });
};

const clearForm = () => {
  resetSearch('images');
  searchImages.value = [];
  filter.value = '';
  searchWord.value = '';
  dispatchSearch();
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
  if (route.query.pageSize) {
    checkPageSize(parseInt(route.query.pageSize as string));
  }
  if (route.query.q && route.query.type) {
    searchEnabled.value = true;
    searchWord.value = route.query.q as string;
    filter.value = route.query.type as string;
    dispatchSearch();
  } else if (imageSearch.value?.value) {
    searchEnabled.value = true;
    filter.value = imageSearch.value?.type;
    searchWord.value = imageSearch.value?.value;
    localSearchMethod();
  } else {
    searchEnabled.value = false;
    dispatchSearch();
  }
});
</script>
