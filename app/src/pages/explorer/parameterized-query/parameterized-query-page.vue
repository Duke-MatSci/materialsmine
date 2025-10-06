<template>
  <div class="sparql-template-page">
    <div v-if="loadingTemplates">
      <md-progress-spinner md-mode="indeterminate" />
    </div>
    <div v-else-if="totalTemplateCount === 0">
      <p>No templates were loaded</p>
    </div>
    <div v-else>
      <h1 class="visualize_header-h1 u_margin-top-med u--margin-leftsm">
        {{ pageTitle[currentIndex] || 'parameterized query' }}
      </h1>
      <div class="viz-sample__header">
        <h3 class="md-title">Query Template</h3>
      </div>
      <div class="u_display-flex display">
        <md-button class="template-back" @click="shiftTemplate(-1)">
          <md-icon>chevron_left</md-icon>
        </md-button>
        <md-button class="template-next" @click="shiftTemplate(1)">
          <md-icon>chevron_right</md-icon>
        </md-button>
        <p class="display-text">
          <span
            v-for="(segment, index) in selectedTemplate.displaySegments"
            :key="index"
          >
            <span
              v-if="segment.type == TextSegmentType.TEXT"
              v-html="segment.text"
            ></span>
            <span v-else>
              <select
                v-model="varSelections[segment.varName!]"
                :id="segment.varName"
                :name="segment.varName"
              >
                <option
                  v-for="(value, name) in selectedTemplate.options[segment.varName!]"
                  :key="name"
                  :value="name"
                >
                  {{ name }}
                </option>
              </select>
            </span>
          </span>
        </p>
      </div>
      <div class="display-count-indicator">
        <p>Query template {{ currentIndex + 1 }} of {{ totalTemplateCount }}</p>
      </div>
      <div class="query" v-if="query">
        <accordion :startOpen="false" title="SPARQL Query">
          <yasqe :value="query" :readOnly="true" :showBtns="false"></yasqe>
        </accordion>
      </div>
      <div class="results">
        <accordion :startOpen="true" title="SPARQL Results">
          <div class="u_display-flex results-controls">
            <button
              class="btn btn--primary"
              :disabled="autoRefresh || !newQuery"
              @click="execQuery"
            >
              Search Query
            </button>
            <md-switch class="md-primary" v-model="autoRefresh">
              Auto Refresh
            </md-switch>
            <div class="u_display-flex button-row">
              <div>
                <button class="btn btn--primary" @click="selectQueryForVizEditor()">
                  Open in Datavoyager
                </button>
              </div>
            </div>
          </div>
          <div class="u_display-flex results-progress" v-show="runningQuery">
            <spinner
              :loading="runningQuery"
              text="Loading your request..."
              v-if="runningQuery"
            />
          </div>
          <div v-show="!runningQuery">
            <yasr v-if="results" :results="results" />
            <p v-else class="no-results-message">
              No results yet. Press "Refresh Results" to run the query and see results.
            </p>
          </div>
        </accordion>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { querySparql } from '@/modules/sparql';
import {
  loadSparqlTemplates,
  TextSegmentType,
  OptValueType,
  SparqlTemplate,
  OptValue,
} from './sparql-templates';
import debounce from '@/modules/debounce';
import accordion from '@/components/Accordion.vue';
import yasr from '@/components/explorer/Yasr.vue';
import yasqe from '@/components/explorer/Yasqe.vue';
import spinner from '@/components/Spinner.vue';

defineOptions({
  name: 'ParameterizedQueryPage',
});

const store = useStore();
const router = useRouter();

// Reactive state
const loadingTemplates = ref(true);
const runningQuery = ref(false);
const queryTemplates = ref<Record<string, SparqlTemplate>>({});
const selTemplateId = ref<string | null>(null);
const query = ref('');
const varSelections = ref<Record<string, string>>({});
const results = ref<unknown>(null);
const autoRefresh = ref(false);
const lastRunQuery = ref('');
const pageTitle = ref<string[]>([]);

// Computed properties
const templateIds = computed(() => Object.keys(queryTemplates.value));

const selectedTemplate = computed<SparqlTemplate>(() => {
  return queryTemplates.value[selTemplateId.value!];
});

const currentIndex = computed(() => {
  return templateIds.value.indexOf(selTemplateId.value!);
});

const totalTemplateCount = computed(() => {
  return templateIds.value.length;
});

const newQuery = computed(() => {
  return query.value !== lastRunQuery.value;
});

// Methods
const selectQueryForVizEditor = (): void => {
  store.commit('vega/setQuery', query.value);
  router.push({ name: 'NewChartDataVoyager' });
};

const loadTemplates = async (): Promise<void> => {
  loadingTemplates.value = true;
  try {
    const templates = await loadSparqlTemplates();
    queryTemplates.value = {};
    templates.forEach((t) => {
      queryTemplates.value[t.id] = t;
    });
    selTemplateId.value = templates.length > 0 ? templates[0].id : null;
  } finally {
    loadingTemplates.value = false;
  }
};

const shiftTemplate = (amount: number): void => {
  let newIndex = currentIndex.value + amount;
  while (newIndex >= totalTemplateCount.value) {
    newIndex -= totalTemplateCount.value;
  }
  while (newIndex < 0) {
    newIndex += totalTemplateCount.value;
  }
  selTemplateId.value = templateIds.value[newIndex];
};

const populateSelections = (): void => {
  if (!selectedTemplate.value) {
    return;
  }
  varSelections.value = Object.fromEntries(
    Object.entries(selectedTemplate.value.options).map(([varName, varOpts]) => [
      varName,
      Object.keys(varOpts)[0],
    ])
  );
};

const getOptVal = (varName: string, optName: string): OptValue => {
  return selectedTemplate.value.options[varName][optName];
};

const buildQuery = (): void => {
  if (!selectedTemplate.value) {
    return;
  }
  let tempQuery = selectedTemplate.value.SPARQL;

  // append VALUES clause to query if there are any active selections
  const activeSelections = Object.fromEntries(
    Object.entries(varSelections.value).filter(
      (selEntry) => getOptVal(...selEntry).type !== OptValueType.ANY
    )
  );
  if (Object.keys(activeSelections).length > 0) {
    const varNames = Object.keys(activeSelections)
      .map((varName) => `?${varName}`)
      .join(' ');

    const optVals = Object.entries(activeSelections)
      .map((selEntry) => {
        const optVal = getOptVal(...selEntry);
        let value: string;
        if (optVal.type === OptValueType.LITERAL) {
          let literalValue = optVal.value;
          if (typeof literalValue !== 'number') {
            literalValue = `"${literalValue}"`;
          }
          value = String(literalValue);
        } else if (optVal.type === OptValueType.IDENTIFIER) {
          value = `<${optVal.value}>`;
        } else {
          throw new Error(`Unknown option value type: ${optVal.type}`);
        }
        return value;
      })
      .join(' ');
    const valuesBlock = `\n  VALUES (${varNames}) {\n    (${optVals})\n  }\n`;

    tempQuery = tempQuery.replace(/(where\s*{)/i, '$1' + valuesBlock);
  }

  // find any replaceable variable names
  const activeReplacements = Object.fromEntries(
    Object.entries(selectedTemplate.value.replacements).map(([varName, varObj]) => {
      // find the actively selected option
      return [
        varName,
        varObj.varFormat.replace('${' + 'var}', varSelections.value[varObj.subVar]),
      ];
    })
  );
  if (Object.keys(activeReplacements).length > 0) {
    // replacements are active
    Object.keys(activeReplacements).forEach((varName) => {
      // convert to variable names and replace in query
      const replacement = `?${camelize(activeReplacements[varName])}`;
      const originalRE = new RegExp('\\?' + varName, 'g');
      tempQuery = tempQuery.replaceAll(originalRE, replacement);
    });
  }
  query.value = tempQuery;
};

const camelize = (str: string): string => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match) {
    if (+match === 0) return '';
    return match.toUpperCase();
  });
};

const execQuery = async (): Promise<void> => {
  results.value = null;
  lastRunQuery.value = query.value;
  runningQuery.value = true;
  results.value = await querySparql(query.value);
  runningQuery.value = false;
};

const autoExecQuery = (): void => {
  if (autoRefresh.value && newQuery.value) {
    execQuery();
  }
};

const updatePageTitleArray = (): void => {
  if (queryTemplates.value && Object.keys(queryTemplates.value).length > 0) {
    pageTitle.value = Object.keys(queryTemplates.value).map((key) => {
      const matches = queryTemplates.value[key].display.match(/<b>(.*?)<\/b>/g);
      return (
        matches
          ?.map((val) => {
            return val.replace(/<\/?b>/g, '');
          })
          .pop() || ''
      );
    });
  }
};

// Debounced function
const execQueryDebounced = debounce(autoExecQuery, 300);

// Lifecycle hooks
onMounted(() => {
  loadTemplates();
});

// Watchers
watch(selectedTemplate, () => {
  populateSelections();
});

watch(
  varSelections,
  () => {
    buildQuery();
  },
  { deep: true }
);

watch(query, () => {
  execQueryDebounced();
});

watch(autoRefresh, () => {
  execQueryDebounced();
});

watch(queryTemplates, () => {
  updatePageTitleArray();
});
</script>

<style lang="scss" scoped>
.sparql-template-page {
  max-width: 960px;
  margin: auto;
}
.button-row {
  margin: 10px 0;
  justify-content: flex-end;
}
.display {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 18em;
  .template-next {
    order: 1;
  }
  .display-text {
    max-height: calc(100% - 60px);
    overflow: auto;
    margin: 30px;
    font-size: 16px;
    line-height: 40px;
  }
}
.display-count-indicator {
  text-align: center;
  margin-bottom: 20px;
  font-weight: 500;
}
.accordion {
  margin-bottom: 20px;
}
.results-controls {
  margin: 20px 10px;
  justify-content: space-between;
  align-items: center;

  > * {
    margin-right: 50px;
  }
}
.results-progress {
  justify-content: center;
}
.no-results-message {
  text-align: center;
  margin-top: 20px;
}
</style>
