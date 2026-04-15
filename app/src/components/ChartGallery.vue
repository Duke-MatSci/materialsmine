<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner :loading="loading" text="Loading Charts" />
    </div>
    <div v-else>
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="otherArgs != null">{{ otherArgs }}</strong>
          <template v-if="isFavourite">
            <span v-if="totalFavorites === 0"> No favorite results </span>
            <span v-else-if="totalFavorites === 1"> 1 favorite result </span>
            <span v-else> About {{ totalFavorites }} favorite results </span>
          </template>
          <template v-else>
            <span v-if="total === 0"> No results </span>
            <span v-else-if="total === 1"> 1 result </span>
            <span v-else> About {{ total }} results </span>
          </template>
          ({{ (queryTimeMillis / 1000).toFixed(2) }} seconds)
        </span>
      </div>
      <template v-if="!!galleryChartItems && !!galleryChartItems.length">
        <div :class="isFavourite ? 'gallery-grid grid grid_col-3' : 'gallery-grid grid grid_col-5'">
          <MdCard
            v-for="(result, index) in galleryChartItems"
            :key="index"
            class="btn--animated gallery-item"
          >
            <div class="u_gridicon">
              <div @click.prevent="bookmark(result)" v-if="isAuth">
                <MdIcon>bookmark</MdIcon>
                <MdTooltip md-direction="top"> Add to Favorites </MdTooltip>
              </div>
              <!-- <div @click.prevent="bookmark(result.name, false)" v-else>
                <MdIcon>bookmark_border</MdIcon>
              </div> -->
              <div v-if="isAuth" @click.prevent="editChart(result)">
                <MdIcon>edit</MdIcon>
                <MdTooltip md-direction="top">Edit </MdTooltip>
              </div>
              <div
                v-if="isAuth && isAdmin"
                @click.prevent="renderDialog('Delete Chart?', 'delete', result, 80)"
              >
                <MdIcon>delete_outline</MdIcon>
              </div>
            </div>
            <router-link
              v-if="result.identifier"
              :to="{
                name: 'ChartView',
                params: { chartId: getChartId(result) },
              }"
            >
              <MdCardMediaCover md-solid>
                <MdCardMedia md-ratio="4:3">
                  <img
                    :src="getChartThumbnailSrc(index)"
                    :alt="result.label"
                    @error="onThumbnailError(index, result.thumbnail)"
                    v-if="result.thumbnail"
                  />
                  <img src="../assets/img/rdf_flyer.svg" :alt="result.label" v-else />
                </MdCardMedia>
                <MdCardArea class="u_gridbg">
                  <MdCardHeader class="u_show_hide">
                    <span class="md-subheading">
                      <strong>{{ result.label }}</strong>
                    </span>
                    <span class="md-body-1">{{ reduceDescription(result.description, 15) }}</span>
                  </MdCardHeader>
                </MdCardArea>
              </MdCardMediaCover>
            </router-link>
          </MdCard>
        </div>
        <pagination :cpage="page" :tpages="totalPages" @go-to-page="loadPrevNextImage($event)" />
      </template>
      <div class="utility-roverflow u_centralize_text u_margin-top-med section_loader" v-else>
        <!-- <div class="u_display-flex spinner"></div> -->
        <h1 class="visualize_header-h1 u_margin-top-med">No Charts Exist...</h1>
      </div>
    </div>
    <Dialog :active="dialogBoxActive" :min-width="dialog.minWidth">
      <template #title>{{ dialog.title }}</template>
      <template #content>
        <div v-if="dialog.type == 'delete'">
          <MdContent v-if="dialog.chart">
            <div>
              This will permanently remove the chart
              <b>{{ dialog.chart.label }}</b>
            </div>
            with identifier <b>{{ dialog.chart.identifier }}</b>
          </MdContent>
        </div>
        <div v-if="dialog.type == 'missingChart'">
          <MdContent>
            <div>{{ formatText }}</div>
          </MdContent>
        </div>
      </template>
      <template #actions>
        <MdButton v-if="dialog.type == 'delete'" @click="deleteChart(dialog.chart)"
          >Delete</MdButton
        >
        <MdButton @click="closeDialog">Cancel</MdButton>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeMount, watch, Ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useReduce } from '@/composables/useReduce';
import { useExplorerQueryParams } from '@/composables/useExplorerQueryParams';
import Spinner from '@/components/Spinner.vue';
import Pagination from '@/components/explorer/Pagination.vue';
import Dialog from '@/components/Dialog.vue';
import { toChartId } from '@/modules/vega-chart';
import { prodFailingCharts } from '@/modules/kg-utils';

// Component name for debugging
defineOptions({
  name: 'ChartGallery',
});

// Props
interface Props {
  sender?: string;
  isFavourite?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sender: 'Visualization Gallery',
  isFavourite: false,
});

// Store and router
const store = useStore();
const router = useRouter();

// Composables
const { reduceDescription } = useReduce();

// Local search method for query params composable
const localSearchMethod = async (): Promise<void> => {
  await loadItems(pageNumber.value);
};

const { pageNumber, pageSize, loadParams, loadPrevNextImage } = useExplorerQueryParams({
  localSearchMethod,
  hasPageSize: true,
});

// Reactive data
const loading = ref(false);
const otherArgs = ref(null);
const baseUrl = ref(`${window.location.origin}/api/knowledge/images?uri=`);
const defaultImg = new URL('../assets/img/rdf_flyer.svg', import.meta.url).href;
const thumbnailSrcs: Record<number, string> = reactive({});
const thumbnailFallbackStep: Record<number, number> = {};

const extractThumbnailId = (thumbnail: string): string => {
  const segment = thumbnail.split('/').pop() || '';
  return segment.replace(/_depiction$/, '');
};

const chartEnv = (() => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'dev';
  if (hostname.startsWith('qa.materialsmine')) return 'stage';
  return 'prod';
})();

const getIdx = (idx: number | string) => (typeof idx === 'string' ? parseInt(idx) : idx);

const getChartThumbnailSrc = (idx: number | string): string => {
  const index = getIdx(idx);
  if (thumbnailSrcs[index]) return thumbnailSrcs[index];
  const result = galleryChartItems.value[index];
  const id = extractThumbnailId(result.thumbnail);
  const src = `/img/charts/${chartEnv}/${id}.png`;
  thumbnailSrcs[index] = src;
  thumbnailFallbackStep[index] = 0;
  return src;
};

const onThumbnailError = (idx: number | string, thumbnail: string): void => {
  const index = getIdx(idx);
  const id = extractThumbnailId(thumbnail);
  const step = (thumbnailFallbackStep[index] ?? 0) + 1;
  thumbnailFallbackStep[index] = step;

  const fallbacks = [
    `/img/charts/${chartEnv}/${id}.jpg`,
    `/img/charts/${chartEnv}/${id}.svg`,
    `${baseUrl.value}${thumbnail}`,
    defaultImg,
  ];

  if (step <= fallbacks.length) {
    thumbnailSrcs[index] = fallbacks[step - 1];
  }
};
const dialog: Ref<any> = ref({
  title: 'Test',
  type: '',
  minWidth: 60,
  chart: null,
});
const dialogLoading = ref(false);

// Computed properties
const dialogBoxActive = computed(() => store.getters.dialogBox);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);
const items = computed(() => store.getters['explorer/gallery/items']);
const page = computed(() => store.getters['explorer/gallery/page']);
const rawTotal = computed(() => store.getters['explorer/gallery/total']);
const total = computed(() => {
  if (chartEnv !== 'prod') return rawTotal.value;
  return Math.max(0, rawTotal.value - prodFailingCharts.length);
});
const totalPages = computed(() => store.getters['explorer/gallery/totalPages']);
const queryTimeMillis = computed(() => store.getters['explorer/gallery/queryTimeMillis']);
const newChartExist = computed(() => store.getters['explorer/curation/getNewChartExist']);
const favoriteChartItems = computed(() => store.getters['explorer/gallery/favoriteChartItems']);
const totalFavorites = computed(() => store.getters['explorer/gallery/totalFavorites']);
const missingCharts = computed(() => store.getters['explorer/gallery/missingCharts']);

const galleryChartItems = computed(() => {
  const source = props.isFavourite ? favoriteChartItems.value : items.value;
  if (chartEnv !== 'prod' || !source) return source;
  return source.filter((chart: any) => {
    const id = chart.identifier?.split('/').pop() || '';
    return !prodFailingCharts.includes(id);
  });
});

watch(galleryChartItems, () => {
  Object.keys(thumbnailSrcs).forEach((key) => delete thumbnailSrcs[+key]);
  Object.keys(thumbnailFallbackStep).forEach((key) => delete thumbnailFallbackStep[+key]);
});

const formatText = computed(() => {
  const message = `${missingCharts.value.length} out of your favourite charts `;
  return missingCharts.value.length === 1
    ? `${message}is no longer available and has been removed from your favourite list.`
    : `${message}are no longer available and have been removed from your favourite list.`;
});

// Methods
const renderDialog = (title: string, type: string, result: any, minWidth: number) => {
  dialog.value = {
    title,
    type,
    minWidth,
    chart: result,
  };
  toggleDialogBox();
};

const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const closeDialog = () => {
  toggleDialogBox();
};

const deleteChart = async (chart: any, retry = false) => {
  try {
    if (!isAdmin.value) return; // temporary safeguard

    // Retry is a flag to determine if the function is called from retry action
    if (!retry) {
      dialogLoading.value = true;
    }
    await store.dispatch('explorer/curation/deleteEntityNanopub', chart.identifier);
    await store.dispatch('explorer/curation/deleteEntityES', {
      identifier: chart.identifier,
      type: 'charts',
    });
    await loadItems();
    if (!retry) {
      toggleDialogBox();
      dialogLoading.value = false;
    }
    return;
  } catch (error) {
    if (!retry) {
      toggleDialogBox();
      dialogLoading.value = false;
    }
    store.commit('setSnackbar', {
      message: error || 'Something went wrong',
      action: () => deleteChart(chart, true),
    });
  }
};

const editChart = (chart: any) => {
  if (chart.thumbnail?.endsWith('_depiction')) {
    store.commit('setSnackbar', {
      message:
        'This chart is based on a legacy ontology and cannot be edited. Please recreate it using the updated FAIR-compliant ontology',
      duration: 60000,
    });
    return;
  }
  return router.push(`/explorer/chart/editor/edit/${getChartId(chart)}`);
};

const bookmark = async (chart: any) => {
  await store.dispatch('explorer/gallery/bookmarkChart', { chart });
};

const loadItems = async (page = 1) => {
  try {
    loading.value = true;
    await store.dispatch('explorer/gallery/loadItems', { page });
    loading.value = false;
  } catch (error) {
    store.commit('setSnackbar', {
      message: error || 'Something went wrong',
      action: () => loadItems(page),
    });
    return (loading.value = false);
  }
};

const getChartId = (chart: any) => {
  return toChartId(chart.identifier);
};

// const formatMissingFavouriteText = () => {
//   const message = `${missingCharts.value.length} out of your favourite charts `;
//   return missingCharts.value.length === 1
//     ? `${message}is no longer available and has been removed from your favourite list.`
//     : `${message}are no longer available and have been removed from your favourite list.`;
// };

const checkAndRenderDialog = () => {
  if (!missingCharts.value.length) return null;
  else renderDialog('Missing Charts', 'missingChart', '', 80);
};

const loadFavorites = async () => {
  loading.value = true;
  if (!favoriteChartItems.value.length) {
    await store.dispatch('explorer/gallery/fetchFavoriteCharts', false);
  }
  loading.value = false;
  return checkAndRenderDialog();
};

const loadRegularCharts = async () => {
  const query = router.currentRoute.value.query;
  if (query?.page) {
    await loadParams(query);
  } else {
    await loadItems();
  }
};

// Lifecycle
onBeforeMount(() => {
  store.commit('setAppHeaderInfo', {
    icon: '',
    name: props.sender,
  });
});

onMounted(async () => {
  if (props.isFavourite) {
    await loadFavorites();
  } else {
    return await loadRegularCharts();
  }
});

// Watchers
watch(newChartExist, () => {
  if (!props.isFavourite) {
    store.commit('explorer/curation/setNewChartExist', false);
    return loadItems();
  }
});

watch(dialogBoxActive, () => {
  if (dialogBoxActive.value === false && props.isFavourite) {
    store.commit('explorer/gallery/setMissingCharts', [], { root: true });
  }
});
</script>
