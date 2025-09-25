<template>
  <div class="chart_editor">
    <div class="u--layout-width viz-sample u--layout-flex utility_flex_mobile">
      <div v-if="loading" class="editImage_modal" style="z-index: 4">
        <spinner :loading="loading" />
      </div>
      <!-- Left element -->
      <div class="chart_editor__left-view" style="flex: 1 1 50%">
        <div class="u--layout-width u--layout-flex u--layout-flex-justify-fs u_margin-bottom-small">
          <a
            @click.prevent="leftTab = 1"
            :class="[leftTab === 1 ? 'active u--color-primary' : '']"
            class="viz-tab__button"
            >Sparql</a
          >
          <a
            @click.prevent="leftTab = 2"
            :class="[leftTab === 2 ? 'active u--color-primary' : '']"
            class="viz-tab__button"
            >Vega</a
          >
          <a
            @click.prevent="leftTab = 3"
            :class="[leftTab === 3 ? 'active u--color-primary' : '']"
            class="viz-tab__button"
            >Save Chart</a
          >
        </div>

        <div class="chart_editor__left-content">
          <yasqe
            v-if="chart.query"
            v-model="chart.query"
            :value="chart.query"
            @query-success="onQuerySuccess"
            v-show="leftTab === 1"
            :showBtns="true"
          >
          </yasqe>
          <v-jsoneditor
            v-show="leftTab === 2"
            v-model="chart.baseSpec"
            :options="specJsonEditorOpts"
            v-if="chart.baseSpec"
          >
          </v-jsoneditor>
          <form v-show="leftTab === 3">
            <md-field>
              <label>Title</label>
              <md-input v-model="chart.title"></md-input>
            </md-field>

            <md-field>
              <label>Description</label>
              <md-textarea v-model="chart.description"></md-textarea>
            </md-field>

            <button class="btn btn--primary" @click.prevent="saveChart">
              {{ actionType }} <md-icon class="u--color-success">check</md-icon>
            </button>
          </form>
        </div>
      </div>

      <!-- The resizer -->
      <div
        class="u_height--max u--bg-grey u_pointer--ew md-xsmall-hide chart_editor-divider"
        id="dragMe"
      ></div>

      <!-- Right element -->
      <div class="chart_editor__right-view" style="flex: 1 1 50%">
        <h4 class="u--margin-pos">Preview</h4>
        <div
          class="u--layout-width u--layout-flex u--layout-flex-justify-end u_margin-bottom-small"
        >
          <a
            @click.prevent="rightTab = 1"
            :class="[rightTab === 1 ? 'active u--color-primary' : '']"
            class="viz-tab__button"
            >Chart</a
          >
          <a
            @click.prevent="rightTab = 2"
            :class="[rightTab === 2 ? 'active u--color-primary' : '']"
            class="viz-tab__button"
            >Table</a
          >
        </div>

        <div class="chart_editor__right-content">
          <div v-show="rightTab === 1" class="loading-dialog" style="margin: auto">
            <vega-lite
              :spec="spec"
              @new-vega-view="onNewVegaView"
              class="btn--animated vega-embed-chartview"
            />
          </div>

          <div v-show="rightTab === 2" class="viz-intro-query" style="min-height: 40rem !important">
            <yasr :results="results"></yasr>
          </div>
        </div>
      </div>
    </div>
    <md-button
      @click.prevent="goToExplorer"
      class="md-fab md-fixed md-fab-bottom-right md-primary btn--primary"
    >
      <md-icon>arrow_back</md-icon>
    </md-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { querySparql } from '@/modules/sparql';
import {
  saveChart as saveChartFn,
  getDefaultChart,
  buildSparqlSpec,
  loadChart as loadChartFn,
  toChartId,
} from '@/modules/vega-chart';
import VJsoneditor from 'v-jsoneditor';
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue';
import yasqe from '@/components/explorer/Yasqe.vue';
import yasr from '@/components/explorer/Yasr.vue';
import Spinner from '@/components/Spinner.vue';

// Component name for debugging
defineOptions({
  name: 'ChartCreate',
});

// Props
interface Props {
  chartId?: string;
}

const props = defineProps<Props>();

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Reactive data
const loading = ref(true);
const mouseIsDown = ref(false);
const x = ref(0);
const y = ref(0);
const leftTab = ref(1);
const rightTab = ref(1);
const results = ref<any>(null);
const specJsonEditorOpts = ref({
  mode: 'code',
  mainMenuBar: false,
});
const chart = ref<any>({
  baseSpec: null,
  query: null,
  title: null,
  description: null,
});
const actionType = ref('Save Chart');
const submittedIdentifier = ref<string | undefined>(undefined);

// Computed properties
const spec = computed(() => {
  const spec = buildSparqlSpec(chart.value.baseSpec, results.value) ?? {};
  return spec;
});

// Methods
const getSparqlData = () => {
  querySparql(chart.value.query)
    .then(onQuerySuccess)
    .then(() => (loading.value = false))
    .catch(() => (loading.value = false));
};

const onQuerySuccess = (queryResults: any) => {
  results.value = queryResults;
};

const onSpecJsonError = () => {
  // console.log('bad', arguments)
};

const onNewVegaView = async (view: any) => {
  const blob = await view
    .toImageURL('png')
    .then((url: string) => fetch(url))
    .then((resp: Response) => resp.blob());
  const fr = new FileReader();
  fr.addEventListener('load', () => {
    chart.value.depiction = fr.result;
  });
  fr.readAsDataURL(blob);
};

const loadChartData = async () => {
  // this.types = 'new, edit, restore & delete'
  let getChartPromise: Promise<any>;
  if (route.params.type === 'new') {
    actionType.value = 'Save Chart';
    getChartPromise = Promise.resolve(getDefaultChart());
  } else if (route.params.type === 'edit') {
    // fetch chart from knowledge graph
    actionType.value = 'Edit Chart';
    getChartPromise = Promise.resolve(loadChartFn(props.chartId || ''));
  } else {
    // Get chart from mongo backup
    actionType.value = 'Restore Chart';
    reloadRestored();
    return;
  }
  getChartPromise
    .then((chartData) => {
      chart.value = chartData;
      return getSparqlData();
    })
    .catch(() => (loading.value = false));
};

const reloadRestored = async () => {
  // 1. Fetch backup from mongo
  // 2. Post each chart (schema + sparql) to knowledge graph
  // 3. Toggle restore flag in mongo
};

const saveChart = async (): Promise<void> => {
  loading.value = true;
  // Todo (ticket xx): Move this into vuex
  try {
    const chartNanopub: any = await saveChartFn(chart.value);

    if (route.params.type === 'new') {
      // Save chart to MongoDB - async operation
    } else {
      await store.dispatch('explorer/curation/deleteEntityES', {
        // TODO: Can we change these to a materialsmine.org uri or will that break things?
        identifier: `http://nanomine.org/viz/${props.chartId}`,
        type: 'charts',
      });
      // Find in mongo and update - async operation
    }

    const resp: any = await store.dispatch('explorer/curation/cacheNewEntityResponse', {
      identifier: submittedIdentifier.value,
      resourceNanopub: chartNanopub,
      type: 'charts',
    });

    if (resp.identifier) {
      submittedIdentifier.value = resp.identifier;
    }

    // This next line tells the gallery page to fetch cos a new chart exist
    store.commit('explorer/curation/setNewChartExist', true);
    loading.value = false;
    // Change button name after submission
    actionType.value = 'Edit Chart';
    store.commit('setSnackbar', {
      message: 'Chart saved successfully!',
      duration: 15000,
    });

    if (route.params.type === 'new') {
      router.push(`/explorer/chart/editor/edit/${toChartId(resp.identifier)}`);
      return;
    }
  } catch (err: any) {
    // TODO (Ticket xxx): USE THE APP DIALOGUE BOX INSTEAD OF ALERT BOX
    return alert(err);
  }
};

const goToExplorer = () => {
  router.push('/explorer/chart');
};

// Lifecycle
onMounted(() => {
  loading.value = true;
  loadChartData();
});
</script>
