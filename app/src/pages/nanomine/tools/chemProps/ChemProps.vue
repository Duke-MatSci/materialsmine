<template>
  <div class="chemprops tool_page md-layout md-alignment-top-center">
    <div
      class="md-layout-item md-size-60 md-small-size-85 md-xsmall-size-90 md-layout md-alignment-top-center md-gutter"
    >
      <dialog-box :active="dialogBoxActive">
        <template v-slot:title>{{ dialog.title }}</template>
        <template v-slot:content>{{ dialog.content }}</template>
        <template v-slot:actions>
          <md-button @click.prevent="toggleDialogBox">Close</md-button>
        </template>
      </dialog-box>
      <div class="team_header u_margin-bottom-med u_margin-top-small">
        <h1 class="visualize_header-h1 teams_header">
          ChemProps - A growing polymer name and filler name standardization
          database
        </h1>
      </div>
      <div class="u_margin-bottom-small">
        <h3 class="u_margin-bottom-small">Description</h3>
        <p class="u_margin-top-small search_box_link utility-line-height-sm">
          ChemProps is a growing polymer name and filler name standardization
          database. Polymer names and filler names can have many alias, impeding
          the queries to collect all relevant data by a chemical name as the
          keyword. ChemProps is a useful resource to address this problem. It
          standardizes the chemical names that belong to the same database such
          that queries can retrieve all data that is related to a certain chemical
          name regardless of how they were originally reported. You can find more
          details in our paper
          <a
            class="u_color"
            href="https://jcheminf.biomedcentral.com/articles/10.1186/s13321-021-00502-6"
            target="_blank"
            >"ChemProps: A RESTful API enabled database for composite polymer name
            standardization"</a
          >.
        </p>
      </div>
      <div>
        <p class="u_margin-top-small search_box_link utility-line-height-sm">
          This webapp is designed for one-time search. For batch jobs, please use
          the ChemProps API. A token is required to use the API. You must be
          logged in to request the ChemProps API token.
        </p>
      </div>
      <div class="u_width--max">
        <div class="md-card-header" v-if="tokenVisible">
          <h3 class="u_margin-bottom-small">Token</h3>
          <div
            style="word-wrap: break-word"
            class="md-card-header utility-gridborder"
          >
            <code> {{ token }} </code>
          </div>
          <div class="md-card-actions md-alignment-right u--padding-zero">
            <button
              @click.prevent="copyContent"
              class="md-button btn btn--primary btn--noradius"
            >
              <span class="md-caption u--bg">Copy token</span>
            </button>
          </div>
        </div>
        <div
          class="u_centralize_content md-card-header u_display-flex u_margin-bottom-med"
        >
          <md-button
            class="md-primary md-raised u_centralize_other btn--primary"
            @click="showToken"
            >Request API Token</md-button
          >
        </div>
        <div class="utility-line-height-sm">
          <h3>Instructions</h3>
          <form
            @submit.prevent="search"
            id="submit-chemprops-form"
            class="u_margin-bottom-med"
          >
            <ol>
              <li>Select the collection.</li>
              <div>
                <md-radio class="md-primary" v-model="pfRadios" value="pol"
                  >Polymer</md-radio
                >
                <md-radio class="md-primary" v-model="pfRadios" value="fil"
                  >Filler</md-radio
                >
              </div>
              <li v-if="pfRadios === 'pol'">
                Input the searching terms. For the quick search, you can search by
                either chemical name, abbreviation, trade name, or SMILES. For the
                advanced search, you must input a chemical name.
              </li>
              <li v-if="pfRadios === 'fil'">
                Input the searching terms. Note that you must input a chemical
                name.
              </li>
              <div>
                <label for="keywordSearch" v-if="pfRadios === 'pol'">
                  Quick Search (Filling this textbox will overwrite the advanced
                  search)
                </label>
                <md-field v-if="pfRadios === 'pol'">
                  <md-input
                    id="keywordSearch"
                    v-model="quickSearchKeyword"
                    placeholder="Enter the keyword:"
                  ></md-input>
                </md-field>
                <label for="fullSearch" v-if="pfRadios === 'pol'"
                  >Advanced Search</label
                >
                <md-field>
                  <md-input
                    id="fullSearch"
                    v-model="chemicalName"
                    placeholder="Enter the chemical name (required):"
                  >
                  </md-input>
                </md-field>
                <md-field>
                  <md-input
                    id="fullSearch"
                    v-model="abbreviation"
                    placeholder="Enter the abbreviation (optional):"
                  >
                  </md-input>
                </md-field>
                <template>
                  <md-field v-if="pfRadios === 'pol'">
                    <md-input
                      id="fullSearch"
                      v-model="SMILES"
                      placeholder="Enter the SMILES (optional):"
                    ></md-input>
                  </md-field>
                  <md-field>
                    <md-input
                      id="fullSearch"
                      v-model="tradename"
                      placeholder="Enter the tradename (optional):"
                    ></md-input>
                  </md-field>
                </template>
              </div>
              <md-button
                type="submit"
                class="md-primary md-raised"
                form="submit-chemprops-form"
                >Search</md-button
              >
            </ol>
          </form>
        </div>
        <div
          class="md-layout u_margin-bottom-big"
          id="chemprops-displayed-result"
          v-if="standardName !== ''"
        >
          <div class="teams_header md-layout-item md-size u_height--auto">
            <h3>Standardized chemical name and density information:</h3>
          </div>
          <div class="md-layout-item md-size-100">
            <label for="standardName">Standardized Name</label>
            <md-field>
              <md-input
                id="standardName"
                v-model="standardName"
                readonly
              ></md-input>
            </md-field>
            <label for="density">Density (g/cm3 at 25°C)</label>
            <md-field>
              <md-input id="density" v-model="density" readonly></md-input>
            </md-field>

            <template v-if="pfRadios === 'pol'">
              <label for="uSMILES">uSMILES</label>
              <md-field>
                <md-input id="uSMILES" v-model="uSMILES" readonly></md-input>
              </md-field>
              <p>
                Structure
                <smiles-canvas
                  :smilesOptions="smilesOptions"
                  :smilesInput="inputStr"
                  :formulaHandler="formulaUpdated"
                  :onErrorHandler="onError"
                  height="100%"
                  width="100%"
                ></smiles-canvas>
              </p>
              <p>Formula: {{molecularFormula}}</p>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import SmilesCanvas from '@/components/nanomine/SmilesCanvas.vue';
import Dialog from '@/components/Dialog.vue';

defineOptions({
  name: 'ChemProps',
});

interface DialogState {
  title: string;
  content?: string;
}

interface SmilesOptions {
  Padding: number;
  atomVisualization: string;
  explicitHydrogens: boolean;
  terminalCarbons: boolean;
  debug: boolean;
}

interface ChemPropsResponse {
  data?: {
    StandardName?: string;
    density?: number;
    uSMILES?: string;
  };
  message?: string;
}

const store = useStore();

// Data
const loading = ref<boolean>(false);
const dialog = ref<DialogState>({
  title: ''
});
const pfRadios = ref<string>('pol');
const quickSearchKeyword = ref<string>('');
const chemicalName = ref<string>('');
const abbreviation = ref<string>('');
const SMILES = ref<string>('');
const tradename = ref<string>('');
const standardName = ref<string>('');
const density = ref<string>('');
const uSMILES = ref<string>('');
const tokenVisible = ref<boolean>(false);
const theme = ref<string>('dark');
const inputStr = ref<string>('');
const molecularFormula = ref<string>('');
const smilesOptions = ref<SmilesOptions>({
  Padding: 0.0,
  atomVisualization: 'default',
  explicitHydrogens: true,
  terminalCarbons: true,
  debug: false
});
const references = ref<string[]>(['10.1186/s13321-021-00502-6', '10.1021/acs.jcim.7b00425']);

// Computed
const dialogBoxActive = computed(() => store.getters.dialogBox);
const token = computed(() => store.getters['auth/token']);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isQuickSearch = computed(() => {
  return pfRadios.value === 'pol' && quickSearchKeyword.value.trim() !== '';
});

// Methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const showToken = (): void => {
  if (!isAuth.value) {
    return store.commit('setSnackbar', {
      message: 'Unauthorized User',
      duration: 4000
    });
  }
  tokenVisible.value = !tokenVisible.value;
};

const copyContent = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(token.value);
    store.commit('setSnackbar', {
      message: 'Token copied successfully',
      duration: 4000
    });
  } catch (error) {
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => copyContent()
    });
  }
};

const scrollToResult = (): void => {
  const elem = document.getElementById('chemprops-displayed-result');
  if (elem) {
    setTimeout(function () {
      elem.scrollIntoView();
    }, 800);
  }
};

const resetOutput = (): void => {
  standardName.value = '';
  density.value = '';
  if (dialogBoxActive.value) {
    toggleDialogBox();
  }
};

const renderDialog = (title: string, content: string): void => {
  dialog.value = {
    title,
    content
  };
  toggleDialogBox();
};

const search = async (): Promise<void> => {
  resetOutput();
  const ChemicalName = isQuickSearch.value
    ? quickSearchKeyword.value
    : chemicalName.value;
  const Abbreviation = isQuickSearch.value
    ? quickSearchKeyword.value
    : abbreviation.value;
  const TradeName = isQuickSearch.value
    ? quickSearchKeyword.value
    : tradename.value;
  const SMILESValue = isQuickSearch.value ? quickSearchKeyword.value : SMILES.value;
  const nmId = references.value[0];

  if (!ChemicalName || !pfRadios.value) {
    const inputError = !chemicalName.value
      ? 'Please input the chemical name.'
      : 'Please select the collection.';
    return renderDialog('Input Error', inputError);
  }

  try {
    loading.value = true;
    const body = JSON.stringify({
      polfil: pfRadios.value,
      ChemicalName,
      Abbreviation,
      TradeName,
      SMILES: SMILESValue,
      nmId
    });
    const request = await fetch('/api/mn/chemprops', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.value
      },
      body
    });
    const response: ChemPropsResponse = await request.json();
    if (request.status !== 200 || !response) {
      const message = response?.message ?? 'Something went wrong';
      throw new Error(message);
    }

    standardName.value = response?.data?.StandardName || '';
    density.value = response?.data?.density ? String(parseFloat(String(response.data.density))) : '';
    if (pfRadios.value === 'pol') {
      uSMILES.value = response?.data?.uSMILES || '';
    }

    if (standardName.value === '') {
      renderDialog(
        'Search Error',
        'No results found. Admin will update the database soon. Please try again in a week.'
      );
      resetOutput();
    }
  } catch (error: any) {
    resetOutput();
    if (error.message.includes('404')) {
      renderDialog(
        'Search Error',
        'No results found. Admin will update the database soon. Please try again in a week.'
      );
    } else {
      renderDialog('Search Error', error?.message);
    }
  } finally {
    loading.value = false;
    inputStr.value = uSMILES.value;
  }
};

const formulaUpdated = (formula: string): void => {
  molecularFormula.value = formula;
};

const onError = (err: string): void => {
  renderDialog('SMILES error', err ?? 'Undefined error');
};

// Watchers
watch(standardName, (newData) => {
  if (newData) {
    scrollToResult();
  }
});

// Lifecycle
onMounted(() => {
  store.commit('setAppHeaderInfo', {
    icon: 'workspaces',
    name: 'ChemProps'
  });
});
</script>
