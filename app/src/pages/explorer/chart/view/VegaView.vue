<template>
<div class="vega-view">
    <div class="utility-content__result">
    <div class="utility-gridicon" v-if="!loading">
        <md-button id="navbackBtn" class="md-icon-button" @click.prevent="navBack">
            <md-tooltip> Go Back </md-tooltip>
            <md-icon>arrow_back</md-icon>
        </md-button>
        <md-button id="shareChartBtn"  class="md-icon-button" @click.prevent="renderDialog('Share chart', 'share', 60)">
            <md-tooltip> Share Chart </md-tooltip>
            <md-icon>share</md-icon>
        </md-button>
        <div v-if="chart.query">
            <md-button id="chartQueryBtn" class="md-icon-button"  @click.prevent="renderDialog('Chart Query', 'query')">
                <md-tooltip> Preview Chart Query </md-tooltip>
                <md-icon>preview</md-icon>
            </md-button>
        </div>
        <div v-if="results">
            <md-button id="dataTableBtn" class="md-icon-button" @click.prevent="renderDialog('Chart Data Table', 'data')">
                <md-tooltip> View Data as Table </md-tooltip>
                <md-icon>table_view</md-icon>
            </md-button>
        </div>
        <div v-if="specViewerSpec">
            <md-button id="vegaSpecBtn" class="md-icon-button" @click.prevent="renderDialog('Chart Vega Spec', 'vega', 80)">
                <md-tooltip> Preview Chart Spec </md-tooltip>
                <md-icon>integration_instructions</md-icon>
            </md-button>
        </div>
        <md-button class="md-icon-button" @click.prevent="openVoyager">
            <md-tooltip> View Data in Voyager </md-tooltip>
            <md-icon>dynamic_form</md-icon>
        </md-button>
        <div v-if="isAuth && isAdmin">
            <md-button class="md-icon-button" @click.prevent="editChart">
                <md-tooltip> Edit Chart </md-tooltip>
                <md-icon>edit</md-icon>
            </md-button>
            <md-button class="md-icon-button" @click.prevent="renderDialog('Delete Chart?', 'delete', 80)">
                <md-tooltip> Delete Chart </md-tooltip>
                <md-icon>delete</md-icon>
            </md-button>
        </div>
    </div>
    </div>

<div class="md-layout md-gutter md-alignment-top-center">
    <div class="md-layout-item  md-size-35 md-small-size-100">
    <div class="loading-dialog_justify">
        <div class="visualize">
        <div class="viz-sample__header" v-if="vizOfTheDay">
            <md-icon style="font-size: 2rem !important; color: gray !important">bar_chart</md-icon> Viz of the day
        </div>
        <div class="viz-sample__header" v-if="!vizOfTheDay">
            Chart Information
        </div>
        <div class="viz-sample__content">
            <div class="">
                <p v-if="error.status"> Error: {{error.message}} </p>
                <div class="md-headline viz-u-mgup-sm btn--animated">{{chart.title}}</div>
                <div class="btn--animated">
                    {{ slugify(chart.description) }}
                </div>
                <div class="viz-sample__list btn--animated">
                    <ul>
                    <li class="viz-u-postion__rel" v-for="(tag, index) in chartTags" :key="index">
                        <div class="viz-sample__content__card viz-u-display__hide viz-u-postion__abs">
                        {{ tag.description }}
                        <div><a class="btn-text btn-text--simple" target="_blank" :href="tag.uri">More</a></div>
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
        <spinner :loading="loading" :text="'Loading chart data...'"/>
    </div>
    <div class="loading-dialog" style="margin: auto" v-else>
        <div class="viz-u-display__desktop" style="margin-bottom: 2rem"/>
        <vega-lite :spec="spec" class="btn--animated vega-embed-chartview"/>
    </div>
    </div>
</div>

<Dialog :active="dialogBoxActive" :min-width="dialog.minWidth">
    <template v-slot:title>{{dialog.title}}</template>
    <template v-slot:content>
        <div v-if="dialog.type=='share'">
            <md-field> <label>Chart Link</label>
                <md-textarea disabled v-model="shareableChartUriValue"></md-textarea>
            </md-field>
            <div>Copy the link above to share this chart</div>
        </div>
        <div v-if="chart.query && dialog.type=='query'" class="viz-intro-query" style="max-height: 40rem !important">
            <div>Copy and rerun query on a sparql endpoint</div>
            <yasqe v-model="chart.query" :showBtns='false' :readOnly="true"></yasqe>
        </div>
        <div v-if="dialog.type=='data'" class="viz-intro-query" style="min-height: 40rem !important">
            <yasr :results="results"></yasr>
        </div>
        <div v-if="dialog.type=='vega'">
            <md-content>
            <json-editor
                v-model="specViewerSpec"
                :options="specViewer.jsonEditorOpts"
            >
            </json-editor>
            </md-content>
            <div class="vega-spec-controls">
                <md-checkbox v-model="specViewer.includeData">Include data in spec</md-checkbox>
            </div>
        </div>
        <div v-if="dialog.type=='delete'">
            <md-content>
                <div> This will permanently remove chart <b>{{chart.title}}</b> </div>
                with identifier <b>{{chart.uri}}</b>.
            </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner
            :loading="dialogLoading"
            text='Deleting Chart'
          />
        </div>
    </template>
    <template v-slot:actions>
        <span v-if="dialog.type=='delete'">
            <md-button @click.prevent="toggleDialogBox">
                No, cancel
            </md-button>
            <md-button @click.prevent="onDeleteChart">
                Yes, delete.
            </md-button>
        </span>
        <md-button v-else @click.prevent="toggleDialogBox">Close</md-button>
    </template>
</Dialog>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import JsonEditor from '@/components/JsonEditor.vue';
import Dialog from '@/components/Dialog.vue';
import { loadChart, buildSparqlSpec, toChartUri, shareableChartUri } from '@/modules/vega-chart';
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue';
import yasqe from '@/components/explorer/yasqe.vue';
import yasr from '@/components/explorer/yasr.vue';
import spinner from '@/components/Spinner.vue';
import { querySparql } from '@/modules/sparql';

defineOptions({
  name: 'chart-view'
});

interface ChartData {
  uri?: string;
  query?: string;
  title?: string;
  description?: string;
  baseSpec?: Record<string, any>;
}

interface ErrorState {
  status: boolean;
  message: string | null;
}

interface DialogState {
  title: string;
  type?: string;
  minWidth?: number;
}

interface Props {
  chartId?: string;
}

const props = defineProps<Props>();

const router = useRouter();
const store = useStore();

const error = ref<ErrorState>({ status: false, message: null });
const loading = ref<boolean>(true);
const spec = ref<any>(null);
const chart = ref<ChartData>({});
const chartTags = ref<any[]>([]);
const vizOfTheDay = ref<boolean>(false);
const specViewer = ref({
  show: false,
  includeData: false,
  jsonEditorOpts: {
    mode: 'code',
    mainMenuBar: false,
    onEditable: () => false
  }
});
const results = ref<any>(null);
const dialog = ref<DialogState>({
  title: ''
});
const dialogLoading = ref<boolean>(false);

const dialogBoxActive = computed(() => store.getters.dialogBox);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);

const specViewerSpec = computed(() => {
  return specViewer.value.includeData ? spec.value : chart.value?.baseSpec;
});

const fullChartUri = computed(() => {
  return props.chartId ? toChartUri(props.chartId) : '';
});

const shareableChartUriValue = computed(() => {
  return props.chartId ? shareableChartUri(props.chartId) : '';
});

const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const loadVisualization = async (): Promise<void> => {
  try {
    chart.value = await loadChart(fullChartUri.value);
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

const navBack = (): void => {
  router.push('/explorer/chart');
};

const openVoyager = (): void => {
  if (!props.chartId) {
    store.commit('setSnackbar', {
      message: 'Data Voyager is not available for the currently viewed chart',
    });
    return;
  }
  router.push({ name: 'ChartDataVoyager', params: { chartId: props.chartId } });
};

const editChart = (): void => {
  router.push(`/explorer/chart/editor/edit/${props.chartId}`);
};

const onDeleteChart = async (): Promise<void> => {
  if (!isAdmin.value) return; // temporary safeguard
  dialogLoading.value = true;
  await store.dispatch('explorer/curation/deleteEntityNanopub', chart.value.uri);
  await store.dispatch('explorer/curation/deleteEntityES', {
    identifier: chart.value.uri,
    type: 'charts'
  });
  toggleDialogBox();
  dialogLoading.value = false;
  router.push('/explorer/chart');
};

const renderDialog = (title: string, type?: string, minWidth?: number): void => {
  dialog.value = {
    title,
    type,
    minWidth
  };
  toggleDialogBox();
};

const slugify = (args: any): any => {
  // return Slug(args)
  return args;
};

onMounted(() => {
  loading.value = true;
  loadVisualization();
});

onUnmounted(() => {
  error.value = { status: false, message: null };
});
</script>
