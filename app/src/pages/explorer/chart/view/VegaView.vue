<template>
  <div class="vega-view">
    <div class="utility-content__result">
      <div class="utility-gridicon" v-if="!loading">
        <md-button id="navbackBtn" class="md-icon-button" @click.prevent="navBack">
          <md-tooltip>Go Back</md-tooltip>
          <md-icon>arrow_back</md-icon>
        </md-button>
        <md-button
          id="shareChartBtn"
          class="md-icon-button"
          @click.prevent="renderDialog('Share chart', 'share', 60)"
        >
          <md-tooltip>Share Chart</md-tooltip>
          <md-icon>share</md-icon>
        </md-button>
        <div v-if="chart.query">
          <md-button
            id="chartQueryBtn"
            class="md-icon-button"
            @click.prevent="renderDialog('Chart Query', 'query')"
          >
            <md-tooltip>Preview Chart Query</md-tooltip>
            <md-icon>preview</md-icon>
          </md-button>
        </div>
        <div v-if="results">
          <md-button
            id="dataTableBtn"
            class="md-icon-button"
            @click.prevent="renderDialog('Chart Data Table', 'data')"
          >
            <md-tooltip>View Data as Table</md-tooltip>
            <md-icon>table_view</md-icon>
          </md-button>
        </div>
        <div v-if="specViewerSpec">
          <md-button
            id="vegaSpecBtn"
            class="md-icon-button"
            @click.prevent="renderDialog('Chart Vega Spec', 'vega', 80)"
          >
            <md-tooltip>Preview Chart Spec</md-tooltip>
            <md-icon>integration_instructions</md-icon>
          </md-button>
        </div>
        <router-link
          class="md-icon-button"
          :to="{ name: 'ChartDataVoyager', params: { chartId: chartId } }"
          v-slot="{ navigate, href }"
          custom
        >
          <md-button class="md-icon-button" :href="href" @click="navigate">
            <md-tooltip>View Data in Voyager</md-tooltip>
            <md-icon>dynamic_form</md-icon>
          </md-button>
        </router-link>
        <div v-if="isAuth && isAdmin">
          <md-button class="md-icon-button" @click.prevent="editChart">
            <md-tooltip>Edit Chart</md-tooltip>
            <md-icon>edit</md-icon>
          </md-button>
          <md-button
            class="md-icon-button"
            @click.prevent="renderDialog('Delete Chart?', 'delete', 80)"
          >
            <md-tooltip>Delete Chart</md-tooltip>
            <md-icon>delete</md-icon>
          </md-button>
        </div>
      </div>
    </div>

    <div class="md-layout md-gutter md-alignment-top-center">
      <div class="md-layout-item md-size-35 md-small-size-100">
        <div class="loading-dialog_justify">
          <div class="visualize">
            <div class="viz-sample__header" v-if="vizOfTheDay">
              <md-icon style="font-size: 2rem !important; color: gray !important"
                >bar_chart</md-icon
              >
              Viz of the day
            </div>
            <div class="viz-sample__header" v-if="!vizOfTheDay">Chart Information</div>
            <div class="viz-sample__content">
              <div class="">
                <p v-if="error.status">Error: {{ error.message }}</p>
                <div class="md-headline viz-u-mgup-sm btn--animated">{{ chart.title }}</div>
                <div class="btn--animated">
                  {{ slugify(chart.description) }}
                </div>
                <div class="viz-sample__list btn--animated">
                  <ul>
                    <li class="viz-u-postion__rel" v-for="(tag, index) in chartTags" :key="index">
                      <div class="viz-sample__content__card viz-u-display__hide viz-u-postion__abs">
                        {{ tag.description }}
                        <div>
                          <a class="btn-text btn-text--simple" target="_blank" :href="tag.uri"
                            >More</a
                          >
                        </div>
                      </div>
                      {{ tag.title }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="md-layout-item md-size-60 md-small-size-100">
        <div class="loading-dialog" style="margin: 5rem" v-if="loading">
          <spinner :loading="loading" :text="'Loading chart data...'" />
        </div>
        <div class="loading-dialog" style="margin: auto" v-else>
          <div class="viz-u-display__desktop" style="margin-bottom: 2rem" />
          <vega-lite :spec="spec" class="btn--animated vega-embed-chartview" />
        </div>
      </div>
    </div>

    <Dialog :active="dialogBoxActive" :min-width="dialog.minWidth">
      <template #title>{{ dialog.title }}</template>
      <template #content>
        <div v-if="dialog.type == 'share'">
          <md-field>
            <label>Chart Link</label>
            <md-textarea disabled v-model="shareableChartUri"></md-textarea>
          </md-field>
          <div>Copy the link above to share this chart</div>
        </div>
        <div
          v-if="chart.query && dialog.type == 'query'"
          class="viz-intro-query"
          style="max-height: 40rem !important"
        >
          <div>Copy and rerun query on a sparql endpoint</div>
          <yasqe v-model="chart.query" :showBtns="false" :readOnly="true"></yasqe>
        </div>
        <div
          v-if="dialog.type == 'data'"
          class="viz-intro-query"
          style="min-height: 40rem !important"
        >
          <yasr :results="results"></yasr>
        </div>
        <div v-if="dialog.type == 'vega'">
          <md-content>
            <v-jsoneditor
              v-model="specViewerSpec"
              :options="specViewer.jsonEditorOpts"
            ></v-jsoneditor>
          </md-content>
          <div class="vega-spec-controls">
            <md-checkbox v-model="specViewer.includeData">Include data in spec</md-checkbox>
          </div>
        </div>
        <div v-if="dialog.type == 'delete'">
          <md-content>
            <div>
              This will permanently remove chart <b>{{ chart.title }}</b>
            </div>
            with identifier <b>{{ chart.uri }}</b
            >.
          </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner :loading="dialogLoading" text="Deleting Chart" />
        </div>
      </template>
      <template #actions>
        <span v-if="dialog.type == 'delete'">
          <md-button @click.prevent="toggleDialogBox">No, cancel</md-button>
          <md-button @click.prevent="deleteChart">Yes, delete.</md-button>
        </span>
        <md-button v-else @click.prevent="toggleDialogBox">Close</md-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import VJsoneditor from 'v-jsoneditor';
import Dialog from '@/components/Dialog.vue';
import {
  loadChart,
  buildSparqlSpec,
  toChartUri,
  shareableChartUri as shareableChartUriFn,
} from '@/modules/vega-chart';
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue';
import yasqe from '@/components/explorer/Yasqe.vue';
import yasr from '@/components/explorer/Yasr.vue';
import Spinner from '@/components/Spinner.vue';
import { querySparql } from '@/modules/sparql';

// Component name for debugging
defineOptions({
  name: 'chart-view',
});

// Props
interface Props {
  chartId: string;
}

const props = defineProps<Props>();

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Reactive data
const error = ref({ status: false, message: null });
const loading = ref(true);
const spec = ref<any>(null);
const chart = ref<any>({});
const chartTags = ref<any[]>([]);
const args = ref<any>(null);
const allowEdit = ref(false);
const vizOfTheDay = ref(false);
const voyager = ref({
  show: false,
});
const specViewer = ref({
  show: false,
  includeData: false,
  jsonEditorOpts: {
    mode: 'code',
    mainMenuBar: false,
    onEditable: () => false,
  },
});
const results = ref<any>(null);
const dialog = ref<{
  title: string;
  type?: string;
  minWidth?: number;
}>({
  title: '',
});
const dialogLoading = ref(false);

// Computed properties
const dialogBoxActive = computed(() => store.getters.dialogBox);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);

const specViewerSpec = computed(() => {
  return specViewer.value.includeData ? spec.value : chart.value && chart.value.baseSpec;
});

const fullChartUri = computed(() => {
  return toChartUri(props.chartId);
});

const shareableChartUri = computed((): string => {
  return shareableChartUriFn(props.chartId);
});

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const loadVisualization = async () => {
  try {
    chart.value = await loadChart(`${fullChartUri.value}`);
    if (chart.value.query) {
      results.value = await querySparql(chart.value.query);
    }
    spec.value = buildSparqlSpec(chart.value.baseSpec, results.value);
  } catch (e: any) {
    error.value = { status: true, message: e.message };
  } finally {
    loading.value = false;
  }
};

const navBack = () => {
  router.push('/explorer/chart');
};

const editChart = () => {
  return router.push(`/explorer/chart/editor/edit/${props.chartId}`);
};

const deleteChart = async () => {
  if (!isAdmin.value) return; // temporary safeguard
  dialogLoading.value = true;
  await store.dispatch('explorer/curation/deleteEntityNanopub', chart.value.uri);
  await store.dispatch('explorer/curation/deleteEntityES', {
    identifier: chart.value.uri,
    type: 'charts',
  });
  toggleDialogBox();
  dialogLoading.value = false;
  router.push('/explorer/chart');
};

const renderDialog = (title: string, type: string, minWidth?: number) => {
  dialog.value = {
    title,
    type,
    minWidth,
  };
  toggleDialogBox();
};

const slugify = (args: string) => {
  // return Slug(args)
  return args;
};

// Lifecycle
onMounted(() => {
  loading.value = true;
  return loadVisualization();
});

onBeforeUnmount(() => {
  error.value = { status: false, message: null };
});
</script>
