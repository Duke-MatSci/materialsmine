<template>
  <div class="datavoyager">
    <div class="utility-content__result">
      <div class="utility-gridicon" v-if="!loading">
        <div>
          <md-button class="md-icon-button" @click.prevent="navBack">
            <md-tooltip md-direction="bottom">Go Back</md-tooltip>
            <md-icon>arrow_back</md-icon>
          </md-button>
          <!-- TODO: Enable save button for new chart creation -->
          <md-button
            class="md-icon-button"
            @click.prevent="saveAsChart"
            v-if="!isNewChart && voyagerSpec"
            disabled
          >
            <md-tooltip md-direction="bottom">Save current spec as new chart</md-tooltip>
            <md-icon>save</md-icon>
          </md-button>
          <!-- TODO: Enable select button for new chart editing -->
          <router-link :to="{ name: 'ChartCreate' }">
            <md-button class="md-icon-button" @click="selectSpec" v-if="isNewChart && voyagerSpec">
              <md-tooltip md-direction="bottom"
                >Select current spec and return to Viz Editor</md-tooltip
              >
              <md-icon>check</md-icon>
            </md-button>
          </router-link>
        </div>
      </div>
    </div>
    <div class="viz-sample__header viz-u-mgbottom">
      <span class="datavoyager-title">Data Voyager</span>
      <span v-if="!isNewChart && chart && chart.title">: {{ chart.title }}</span>
    </div>
    <div class="datavoyager-content">
      <accordion :startOpen="true" title="Instructions" :dense="true" class="datavoyager">
        <div class="datavoyager">
          <p>
            Explore the data by dragging fields from the "<b>Data</b>" panel into slots in the
            "<b>Encoding</b>" panel.
          </p>
          <p>
            If no fields are selected, Data Voyager generates <b>Univariate Summary</b> charts of
            the data.
          </p>
          <p>
            Clicking on the "<b>Specify</b>" (<md-icon>list</md-icon>) button for an individual
            chart in the "<b>Related Views</b>" panel prompts Data Voyager to generate additional
            recommended charts based on the selection.
          </p>
          <ul>
            <li>
              <b>Wildcards</b>: Allow users to include fields without selecting a specific channel
              (encoding slot). Data Voyager will suggest appropriate encodings for that field.
            </li>
            <li>
              <b>Filters</b>: Dropping a field in this slot provides filtering options on that
              field.
            </li>
          </ul>
          <p>
            For more details, see the
            <a
              href="https://data-voyager.gitbook.io/voyager/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Voyager GitBook,
            </a>
            or watch this
            <a href="https://vimeo.com/199084718" target="_blank" rel="noopener noreferrer">
              narrated walkthrough video
            </a>
            from the original developers.
          </p>
        </div>
      </accordion>
    </div>
    <div class="loading-dialog" style="margin: auto" v-if="loading">
      <spinner :loading="loading" />
    </div>
    <div class="loading-dialog" style="margin: auto" v-else>
      <data-voyager :data="data" v-model:spec="voyagerSpec"></data-voyager>
    </div>

    <div class="datavoyager">
      <h4>
        <a
          href="https://idl.cs.washington.edu/papers/voyager2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Voyager 2: Augmenting Visual Analysis with Partial View Specifications
        </a>
      </h4>
      <p>
        Kanit Wongsuphasawat, Zening Qu, Dominik Moritz, Riley Chang, Felix Ouk, Anushka Anand, Jock
        Mackinlay, Bill Howe, Jeffrey Heer
      </p>
      <i>ACM Human Factors in Computing Systems (CHI), 2017</i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { toChartUri } from '@/modules/vega-chart';
import { querySparql, parseSparql } from '@/modules/sparql';
import DataVoyager from '@/components/explorer/DataVoyager.vue';
import Spinner from '@/components/Spinner.vue';
import accordion from '@/components/Accordion.vue';

// Component name for debugging
defineOptions({
  name: 'DataVoyagerPage',
});

// Props
interface Props {
  chartId?: string;
}

const props = defineProps<Props>();

// Store and router
const store = useStore();
const router = useRouter();

// Reactive data
const loading = ref(true);
const voyagerSpec = ref<any>(null);
const data = ref<any>(null);
const specJsonEditorOpts = ref({
  mode: 'code',
  mainMenuBar: false,
});

// Computed properties
const chart = computed(() => store.getters['vega/chart']);
const isNewChart = computed(() => {
  // TODO: Add ability to create new charts from datavoyager once new chart pipeline is set up
  return !props.chartId;
});

// Methods
const loadChart = async (chartUri: string) => {
  await store.dispatch('vega/loadChart', chartUri);
};

const setBaseSpec = (spec: any) => {
  store.commit('vega/setBaseSpec', spec);
};

const loadData = async () => {
  loading.value = true;
  if (!isNewChart.value) {
    await loadChart(toChartUri(props.chartId || ''));
  }
  const sparqlResults = await querySparql(chart.value.query);
  data.value = { values: parseSparql(sparqlResults) };
  loading.value = false;
};

const saveAsChart = () => {
  // TODO: add once pipeline for creating new charts is set up
};

const selectSpec = () => {
  // //TODO: Will be called from saveAsChart
  setBaseSpec(voyagerSpec.value);
  //   this.goToChartEditor()
};

const goToChartView = () => {
  router.push(`/explorer/chart/view/${props.chartId}`);
};

const goToChartEditor = () => {
  // TODO: Link to chart editor once exists
};

const navBack = () => {
  router.back();
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
