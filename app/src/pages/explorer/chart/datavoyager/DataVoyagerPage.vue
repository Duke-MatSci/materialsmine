<template>
  <div class="datavoyager">
    <div class="utility-content__result">
      <div class="utility-gridicon" v-if="!loading">
        <div>
          <md-button class="md-icon-button" @click.prevent="navBack">
            <md-tooltip md-direction="bottom"> Go Back </md-tooltip>
            <md-icon>arrow_back</md-icon>
          </md-button>
          <!-- TODO: Enable save button for new chart creation -->
          <md-button
            class="md-icon-button"
            @click.prevent="saveAsChart"
            v-if="!isNewChart && voyagerSpec"
            disabled
          >
            <md-tooltip md-direction="bottom"> Save current spec as new chart </md-tooltip>
            <md-icon>save</md-icon>
          </md-button>
          <!-- TODO: Enable select button for new chart editing -->
          <router-link
            v-if="isNewChart && voyagerSpec"
            :to="{ name: 'ChartCreate', params: { type: 'new' } }"
          >
            <md-button class="md-icon-button" @click="selectSpec">
              <md-tooltip md-direction="bottom">
                Select current spec and return to Viz Editor
              </md-tooltip>
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
            If no fields are selected, Data Voyager generates
            <b>Univariate Summary</b> charts of the data.
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
      <i> ACM Human Factors in Computing Systems (CHI), 2017 </i>
    </div>

    <Dialog v-if="dataError" :active="dialogBoxActive">
      <template #title>Data Unavailable</template>
      <template #content>
        <md-content>
          <p>The data for the selected chart is no longer available.</p>
          <p>
            You can copy and reuse the chart query to fetch up-to-date data from the knowledge
            graph.
          </p>
        </md-content>
      </template>
      <template #actions>
        <md-button @click="onErrorDismiss">Okay</md-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { toChartUri } from '@/modules/vega-chart';
import { querySparql, parseSparql } from '@/modules/sparql';
import DataVoyager from '@/components/explorer/DataVoyager.vue';
import Dialog from '@/components/Dialog.vue';
import spinner from '@/components/Spinner.vue';
import accordion from '@/components/Accordion.vue';

defineOptions({
  name: 'DataVoyagerPage',
});

interface Props {
  chartId?: string;
}

const props = defineProps<Props>();

const router = useRouter();
const store = useStore();

const loading = ref<boolean>(true);
const voyagerSpec = ref<any>(null);
const data = ref<any>(null);
const dataError = ref<boolean>(false);

const chart = computed(() => store.getters['vega/chart']);
const dialogBoxActive = computed(() => store.getters.dialogBox);

const isNewChart = computed(() => {
  // TODO: Add ability to create new charts from datavoyager once new chart pipeline is set up
  return !props.chartId;
});

const loadData = async (): Promise<void> => {
  try {
    loading.value = true;
    if (!isNewChart.value && props.chartId) {
      await store.dispatch('vega/loadChart', toChartUri(props.chartId));
    }
    const sparqlResults = await querySparql(chart.value.query);
    data.value = { values: parseSparql(sparqlResults) };
    loading.value = false;
  } catch {
    loading.value = false;
    dataError.value = true;
    store.commit('setDialogBox');
  }
};

const onErrorDismiss = (): void => {
  store.commit('setDialogBox');
  if (props.chartId) {
    router.push({ name: 'ChartView', params: { chartId: props.chartId } });
  } else {
    router.push('/explorer/chart');
  }
};

const saveAsChart = (): void => {
  // TODO: add once pipeline for creating new charts is set up
};

const selectSpec = (): void => {
  // //TODO: Will be called from saveAsChart
  store.commit('vega/setBaseSpec', voyagerSpec.value);
  //   goToChartEditor()
};

const goToChartView = (): void => {
  if (props.chartId) {
    router.push(`/explorer/chart/view/${props.chartId}`);
  }
};

const goToChartEditor = (): void => {
  // TODO: Link to chart editor once exists
};

const navBack = (): void => {
  router.back();
};

onMounted(() => {
  loadData();
});
</script>
