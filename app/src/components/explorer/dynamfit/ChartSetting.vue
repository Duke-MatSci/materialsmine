<template>
  <div class="u_width--max utility-bg_border-dark md-card-header u--b-rad">
    <label class="form-label md-subheading">
      <div class="u_margin-bottom-small" v-if="!updateControls">
        Begin by uploading your viscoelastic dataset or selecting from existing entries.
      </div>
      <div class="u_margin-bottom-small" v-else>
        Click reset below to clear all your selections and begin again.
      </div>
    </label>
    <!-- Control Plain  -->
    <div class="search_box_form u_centralize_items">
      <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
        <!-- <template> -->
        <div class="new-item-button-container" v-if="!updateControls">
          <button @click="openSidebar" class="btn btn--primary u--b-rad">
            Continue to Datafile Options
          </button>
          <div class="new-item-new-badge">New</div>
        </div>
        <div v-else title="Click to reset all your selections">
          <button @click="resetAll" class="btn btn--tertiary u_margin-right-small">Reset</button>
          <button v-if="!isSidebarOpen" @click="openSidebar" class="btn btn--primary">
            Open Sidebar
          </button>
          <button v-else @click="closeSidebar" class="btn btn--primary">Close Sidebar</button>
        </div>
        <!-- </template> -->
      </div>
      <div v-if="isSidebarOpen" class="sidebar">
        <button
          class="md-fab md-fixed md-dense md-fab-top-right md-button btn--primary dialog-box_close"
          @click="closeSidebar"
        >
          <md-icon class="utility-navfonticon u--font-emph-xl">close</md-icon>
        </button>
        <template v-if="stepper === 1">
          <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
            Next: Select Domain
          </h2>
          <hr />

          <div class="u_display-flex metamine_footer-ref-header u_centralize_content">
            <div class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width">
              <select
                class="form__input form__input--adjust utility-padding-sm"
                v-model="selectedProperty"
              >
                <option value="select">Select Domain</option>
                <option value="temperature">Temperature</option>
                <option value="frequency">Frequency</option>
              </select>
            </div>
          </div>
          <div class="metamine_footer-ref-header u_display-flex u_centralize_content">
            <button
              @click="increaseStepper"
              class="btn btn--primary u--b-rad"
              :disabled="selectedProperty === 'select'"
            >
              Next
            </button>
          </div>
        </template>
        <template v-if="stepper === 2">
          <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
            Next: Choose how you'd like to provide viscoelastic data
          </h2>
          <hr />
          <!-- Start -->
          <div class="md-layout u--margin-toplg">
            <div class="md-layout-item">
              <div
                id="dynamfit-card"
                class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                @click="selectType('upload')"
              >
                <md-icon class="icons" id="mm">cloud_upload</md-icon>
                <span class="u--font-emph-l">Upload File</span>
                <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                  Upload a compatible viscoelastic file
                  <em>(accepted formats: '.csv', '.tsv')</em>
                </p>
              </div>
            </div>
            <div class="md-layout-item">
              <div
                id="dynamfit-card"
                class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                @click="selectType('explore')"
              >
                <md-icon class="icons" id="mm">manage_search</md-icon>
                <span class="u--font-emph-l">Explore Xml</span>
                <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                  Browse existing entries from the XML repository
                </p>
              </div>
            </div>
          </div>
          <!-- End -->
          <div
            class="metamine_footer-ref-header u_display-flex u_centralize_content md-layout-item_card-btn"
          >
            <button
              @click="decreaseStepper"
              class="btn btn--primary u--b-rad"
              :disabled="selectedProperty === 'select'"
            >
              Change Domain
            </button>
          </div>
        </template>
        <template v-if="stepper === 3">
          <!-- Upload BYOF -->
          <template v-if="dataType === 'upload'">
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">Next: Upload</h2>
            <hr />

            <div class="search_box_form u_centralize_items">
              <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
                <template v-if="!dynamfit.fileUpload">
                  <label for="Viscoelastic_Data" class="u--inline">
                    <div class="form__file-input">
                      <div class="md-theme-default">
                        <label class="btn btn--primary u--b-rad" for="Viscoelastic_Data"
                          ><p class="md-body-1">Upload file</p></label
                        >
                        <div class="md-file">
                          <input
                            @change="onInputChange"
                            accept=".csv, .tsv, .txt"
                            type="file"
                            name="Viscoelastic_Data"
                            id="Viscoelastic_Data"
                          />
                        </div>
                      </div>
                    </div>
                  </label>
                </template>
                <template v-else>
                  <button
                    class="md-button btn btn--tertiary btn--noradius"
                    @click.prevent="resetChart"
                  >
                    Reset
                  </button>
                  <span class="md-caption md-success viz-u-display__show">{{
                    dynamfit.fileUpload
                  }}</span>
                </template>
              </div>
            </div>
          </template>

          <!-- Explore XML -->
          <template v-else>
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
              Next: Explore XML
            </h2>
            <hr />

            <div class="u_display-flex metamine_footer-ref-header u_centralize_content">
              <div class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width">
                <label>Response Limit</label>
                <input
                  class="form__input form__input--adjust utility-padding-sm"
                  type="number"
                  v-model.number="limit"
                  min="1"
                />
              </div>
            </div>
            <div class="metamine_footer-ref-header u_display-flex u_centralize_content">
              <button @click="search" class="btn btn--primary u--b-rad">Search</button>
            </div>
            <!-- Search Response -->
            <div
              v-if="optionalChaining(() => results?.xmls?.length) && !currentItem"
              class="metamine_footer-ref-header"
            >
              <h3 v-if="(results.counts ?? 0) > limit">
                Results ({{ currentPage * limit }} of {{ results.counts ?? 0 }})
              </h3>
              <h3 v-else>Results ({{ currentPage }} of {{ results.counts ?? 0 }})</h3>
              <hr />
              <div class="list-container">
                <div
                  v-for="item in results.xmls"
                  :key="item.id"
                  class="u_display-flex grid_gap-small u_margin-bottom-small"
                >
                  <input
                    type="radio"
                    :id="item.id"
                    :value="item"
                    v-model="currentItem"
                    style="accent-color: #09233c"
                  />
                  <label :for="item.title">{{ item.title }}</label>
                </div>
              </div>
              <Pagination
                v-if="totalPages > 1 && !currentItem"
                :cpage="currentPage"
                :tpages="totalPages"
                @go-to-page="goToPage"
              />
            </div>
            <!-- Selected Item from response -->
            <div v-if="currentItem" class="metamine_footer-ref-header">
              <h3>
                {{ currentItem.title }}
                <span class="u--color-grey-sec u--margin-neg md-body-1"
                  >({{ currentItem.contains.length }} viscoelastic data)</span
                >
              </h3>
              <hr />
              <div class="list-container">
                <div
                  v-for="(item, index) in currentItem.contains"
                  :key="index"
                  class="u_display-flex grid_gap-small u_margin-bottom-small"
                >
                  <input
                    type="radio"
                    :id="String(index)"
                    :value="{ ...item, index: index }"
                    v-model="selectedItemProperty"
                    style="accent-color: #09233c"
                  />
                  <label :for="String(index)"
                    ><span style="display: block"
                      ><strong>Description:</strong> {{ item.property }}</span
                    ><span class="u--color-grey-sec u--margin-neg md-body-1"
                      ><strong>Table:</strong> {{ item.table }}</span
                    ></label
                  >
                </div>
              </div>
              <button @click="goBack" class="select-btn btn btn--primary u--margin-rightlg">
                Go Back
              </button>
              <button @click="handleSelect" class="select-btn btn btn--primary">Select</button>
            </div>
          </template>
        </template>
      </div>
    </div>
    <!-- Dropdown -->
    <div>
      <label for="model" class="md-body-2">Select Fitting Method</label>
      <div class="md-field viz-u-mgbottom-big">
        <select
          :disabled="disableInput"
          v-model="dynamfit.model"
          :class="[disableInput ? 'nuplot-masked' : '', 'form__select u--b-rad']"
          name="model"
          id="model"
        >
          <option value="Linear">Linear</option>
          <option value="LASSO">LASSO</option>
          <option value="Ridge">Ridge</option>
        </select>
      </div>
    </div>

    <!-- Slider  -->
    <div class="viz-u-mgbottom-sm">
      <label for="prony" class="md-body-2">
        Select Number of Prony Terms <span>[{{ dynamfit.range }}]</span>
      </label>
      <div class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel">
        <input
          :disabled="disableInput"
          @mouseenter="showToolTip = true"
          @mouseleave="showToolTip = false"
          name="prony"
          v-model.lazy.number="dynamfit.range"
          type="range"
          min="1"
          max="100"
          :class="[disableInput ? 'nuplot-masked' : '']"
          class="nuplot-range-slider u--layout-width u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
        />
        <div
          :style="{ left: `${dynamfit.range - 5}%` }"
          v-if="showToolTip"
          class="u_margin-top-med viz-u-display__show nuplot-slider-tooltip"
          id="parame-selector-slider-id"
        >
          {{ dynamfit.range }}
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-justify-sb u--color-grey-sec">
        <div>0</div>
        <div>100%</div>
      </div>
    </div>

    <!-- Checkbox -->
    <div style="margin-bottom: 0.5rem">
      <label for="fitSettings" class="md-body-2">Additional Settings</label>
      <div class="u--layout-flex u--layout-flex-justify-sb">
        <md-checkbox v-model="ttsp" class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm">
          ω-T Transformation
        </md-checkbox>
        <!-- <md-checkbox
          :disabled="disableInput"
          v-model="ttsp"
          :class="[
            disableInput ? 'nuplot-masked' : '',
            'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm',
          ]"
        >
          ω-T Transformation
        </md-checkbox> -->
        <md-checkbox
          :disabled="disableInput"
          v-model="dynamfit.fitSettings"
          :class="[
            disableInput ? 'nuplot-masked' : '',
            'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm',
          ]"
        >
          Show Basis Functions
        </md-checkbox>
      </div>
    </div>
    <div class="utility-margin-top u_margin-bottom-small" v-if="ttsp">
      <!-- Transform Method Dropdown -->
      <label for="transformMethods" class="md-body-2">Transform Method:</label>
      <div class="u--margin-neg" id="transformMethods">
        <md-radio id="transformMethodWLF" v-model="transformMethod" value="WLF"
          >WLF <small>(Default)</small></md-radio
        >
        <md-radio id="transformMethodHybrid" v-model="transformMethod" value="hybrid"
          >Hybrid</md-radio
        >
        <md-radio id="transformMethodManual" v-model="transformMethod" value="manual"
          >Manual</md-radio
        >
      </div>

      <!-- Manual Display Fields -->
      <div v-if="isManual" class="md-alert md-alert--info utility-margin-top">
        <md-icon class="md-alert-icon u--color-primary" style="margin-right: 0.8rem">info</md-icon>
        <span class="md-alert-content" v-if="mFile" style="vertical-align: bottom">
          <strong>Filename:</strong> {{ reduceDescription(mFile, 15, true) }}
        </span>
        <span class="md-alert-content" style="vertical-align: bottom" v-else
          ><strong>Filename:</strong> No file uploaded yet.</span
        >
      </div>
      <!-- TTSP Form Fields -->
      <!-- TTSP Tg Value -->
      <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
        <md-field style="max-width: 40% !important">
          <md-input
            v-model="ttspTgValue"
            name="ttspTgValue"
            id="ttspTgValue"
            placeholder="Tg"
            :disabled="!ttsp || tgEstimated"
          ></md-input>
        </md-field>
        <md-checkbox
          :disabled="ttspDisabled"
          v-model="tgEstimated"
          class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
          style="align-items: center"
        >
          Use Estimated Tg
        </md-checkbox>
      </div>
      <!-- TTSP C1 Value -->
      <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
        <md-field style="max-width: 40% !important">
          <md-input
            v-model="ttspC1Value"
            name="ttspC1Value"
            id="ttspC1Value"
            placeholder="C1"
            :disabled="!ttsp || c1Estimated"
          ></md-input>
        </md-field>
        <md-checkbox
          :disabled="ttspDisabled"
          v-model="c1Estimated"
          class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
          style="align-items: center"
        >
          Use Estimated C1
        </md-checkbox>
      </div>
      <!-- TTSP C2 Value -->
      <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
        <md-field style="max-width: 40% !important">
          <md-input
            v-model="ttspC2Value"
            name="ttspC2Value"
            id="ttspC2Value"
            placeholder="C2"
            :disabled="!ttsp || c2Estimated"
          ></md-input>
        </md-field>
        <md-checkbox
          :disabled="ttspDisabled"
          v-model="c2Estimated"
          class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
          style="align-items: center"
        >
          Use Estimated C2
        </md-checkbox>
      </div>
      <!-- TTSP C2 Value -->
      <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
        <md-field style="max-width: 40% !important">
          <md-input
            v-model="ttspTLValue"
            name="ttspTLValue"
            id="ttspTLValue"
            placeholder="TL"
            :disabled="!ttsp || tLEstimated"
          ></md-input>
        </md-field>
        <md-checkbox
          :disabled="ttspDisabled"
          v-model="tLEstimated"
          class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
          style="align-items: center"
        >
          Use Estimated TL
        </md-checkbox>
      </div>
      <!-- TTSP C2 Value -->
      <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
        <md-field style="max-width: 40% !important">
          <md-input
            v-model="ttspEAValue"
            name="ttspEAValue"
            id="ttspEAValue"
            placeholder="EA"
            :disabled="!ttsp || eAEstimated"
          ></md-input>
        </md-field>
        <md-checkbox
          :disabled="ttspDisabled"
          v-model="eAEstimated"
          class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
          style="align-items: center"
        >
          Use Estimated EA
        </md-checkbox>
      </div>
    </div>
    <div class="grid grid_col-2">
      <div class="">
        <a
          v-if="!dynamfit.fileUpload.length"
          class="btn-text"
          style="border-radius: 0% !important"
          href="#"
          v-on:click="useSampleFile"
          ><span class="md-body-1">Use Sample </span></a
        >
        <span
          ><md-icon
            v-if="!dynamfit.fileUpload.length"
            class="u_superscript-icon utility-color"
            :title="sampleTitle()"
            >help_outline</md-icon
          ></span
        >
      </div>
      <div class="utility-align--right">
        <a
          class="btn-text"
          style="border-radius: 0% !important"
          href="/dynamfit-template.tsv"
          download
          ><span class="md-body-1">Download Template</span></a
        >
        <span
          ><md-icon class="u_superscript-icon utility-color" :title="downloadTitle()"
            >help_outline</md-icon
          ></span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useOptionalChaining } from '@/composables';
import { useReduce } from '@/composables/useReduce';
import Pagination from '@/components/explorer/Pagination.vue';

// Component name for debugging
defineOptions({
  name: 'ChartSetting',
});

// Type definitions
interface XmlItem {
  id: string;
  title: string;
  contains: Array<{
    property: string;
    table: string;
  }>;
}

interface SearchResults {
  xmls?: XmlItem[];
  counts?: number;
}

interface SelectedItemProperty {
  property: string;
  table: string;
  index: number;
}

// Composables
const { optionalChaining } = useOptionalChaining();
const { reduceDescription } = useReduce();
const store = useStore();

// Reactive state
const showToolTip = ref(false);
const isTemp = ref(true);
const useSample = ref(false);
const isSidebarOpen = ref(false);
const selectedProperty = ref('select');
const limit = ref(2);
const results = ref<SearchResults>({});
const currentItem = ref<XmlItem | null>(null);
const selectedItemProperty = ref<SelectedItemProperty | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const stepper = ref(1);
const dataType = ref<string | undefined>(undefined);
const ttsp = ref(false);
const transformMethod = ref('');
const ttspTgValue = ref(null);
const tgEstimated = ref(false);
const ttspC1Value = ref(null);
const c1Estimated = ref(false);
const ttspC2Value = ref(null);
const c2Estimated = ref(false);
const ttspTLValue = ref(null);
const ttspEAValue = ref(null);
const tLEstimated = ref(false);
const eAEstimated = ref(false);
const sentRequest = ref(false);

// Computed properties
const token = computed(() => store.getters['auth/token']);
const dynamfit = computed(() => store.getters['explorer/dynamfit']);
const mFile = computed(() => store.getters['explorer/getDynamfitManualFile']);

const disableInput = computed(() => {
  return !dynamfitData.value || !Object.keys(dynamfitData.value).length;
});

const dynamfitData = computed(() => {
  return store.getters['explorer/getDynamfitData'];
});

const updateControls = computed(() => {
  return !!dynamfit.value?.fileUpload || !!results.value?.xmls?.length;
});

const ttspDisabled = computed(() => {
  return selectedProperty.value === 'frequency';
});

const isWLF = computed(() => {
  return ttsp.value && transformMethod.value === 'WLF';
});

const isManual = computed(() => ttsp.value && transformMethod.value === 'manual');
const isHybrid = computed(() => ttsp.value && transformMethod.value === 'hybrid');

// Methods
const resetAll = (): void => {
  closeSidebar();
  resetChart();
  selectedProperty.value = 'select';
  currentItem.value = null;
  selectedItemProperty.value = null;
  currentPage.value = 1;
  totalPages.value = 0;
  results.value = {};
  stepper.value = 1;
  dataType.value = undefined;
};

const selectType = (type: string): void => {
  stepper.value = 3;
  dataType.value = type;
};

const increaseStepper = (): void => {
  stepper.value++;
};

const decreaseStepper = (): void => {
  stepper.value--;
};

const sampleTitle = (): string => {
  // eslint-disable-next-line
  return `An example set of E', E" data for PMMA which can be used to explore the Prony Series fitting and conversion tool.`;
};

const downloadTitle = (): string => {
  // eslint-disable-next-line
  return `An example tsv file of 3 columns containing: frequency, E', E"; no header row. Format your data as this template then 'upload file' to use the Prony Series fitting and conversion tool.`;
};

const onInputChange = async (e: Event): Promise<void> => {
  useSample.value = false;
  displayInfo('Uploading File...');
  const target = e.target as HTMLInputElement;
  const file = [...(target?.files || [])];
  const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain'];
  try {
    const extension = file[0]?.type?.replace(/(.*)\//, '') || file[0]?.name.split('.').pop();
    if (!extension || !allowedTypes.includes(extension)) {
      return displayInfo('Unsupported file format');
    }
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isTemp: isTemp.value,
    });
    if (fileName) {
      dynamfit.value.fileUpload = fileName;
      displayInfo('Upload Successful', 1500);
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => onInputChange(e),
    });
  }
};

const useSampleFile = async (): Promise<void> => {
  closeSidebar();
  useSample.value = true;
  displayInfo('Using sample file', 1500);
  dynamfit.value.fileUpload = 'test.tsv';
};

const resetChart = async (): Promise<void> => {
  const name = dynamfit.value.fileUpload || selectedItemProperty.value?.index;
  if (!name) return;

  // Clear snackbar if exist on UI
  store.commit('resetSnackbar');

  // DO NOT call BE to delete for sample file
  if (!useSample.value) {
    const { deleted, error } = await store.dispatch('deleteFile', {
      name,
      isTemp: isTemp.value,
    });
    if (!error && deleted) {
      return clearDynamfitData();
    }
  } else {
    return clearDynamfitData();
  }
};

const displayInfo = (msg: string, duration?: number): void => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000,
    });
  }
};

const clearDynamfitData = (): void => {
  // First reset useSample flag if in use
  useSample.value = false;
  store.commit('explorer/resetDynamfit');
  store.commit('explorer/resetDynamfitData');
};

const updateChart = async (): Promise<void> => {
  // If user is exploring XML
  if ((selectedItemProperty.value?.index ?? -1) >= 0) {
    return await handleSelect();
  }

  const payload: any = { useSample: useSample.value, file_name: dynamfit.value.fileUpload };
  payload.number_of_prony = dynamfit.value.range;
  payload.model = dynamfit.value.model;
  payload.fit_settings = dynamfit.value.fitSettings;
  payload.domain = selectedProperty.value;

  // TTSP Args
  if (transformMethod.value && !isManual.value) {
    payload.transform_method = transformMethod.value;
    if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
    if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
    if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
    if (tgEstimated.value) payload.Tg_estimate = tgEstimated.value;
    if (c1Estimated.value) payload.C1_estimate = c1Estimated.value;
    if (c2Estimated.value) payload.C2_estimate = c2Estimated.value;

    if (isHybrid.value) {
      if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
      if (ttspTLValue.value) payload.TL = ttspTLValue.value;
      if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
      if (tLEstimated.value) payload.TL_estimate = tLEstimated.value;
    }
  } else if (transformMethod.value && isManual.value) {
    payload.transform_method = transformMethod.value;
    payload.shift_file_name = mFile.value;
  }

  isSidebarOpen.value = false;
  store.commit('explorer/setDynamfitDomain', selectedProperty.value);
  await store.dispatch('explorer/fetchDynamfitData', payload);
};

const openSidebar = (): void => {
  isSidebarOpen.value = true;
};

const closeSidebar = (): void => {
  isSidebarOpen.value = false;
};

const goBack = (): void => {
  currentItem.value = null;
  selectedItemProperty.value = null;
};

const handleSelect = async (): Promise<void> => {
  if (sentRequest.value)
    store.commit('setSnackbar', { message: 'Please wait & try after a few sec' });

  if (!selectedItemProperty.value) {
    store.commit('setSnackbar', {
      message: 'Please select an item before proceeding.',
      type: 'error',
      duration: 4000,
    });
    return;
  }

  sentRequest.value = true;
  isSidebarOpen.value = false;
  try {
    const payload = {
      id: currentItem.value?.id,
      domain: selectedProperty.value,
      index: selectedItemProperty.value.index,
      numberOfProny: dynamfit.value.range,
      model: dynamfit.value.model,
      fitSettings: dynamfit.value.fitSettings,
    };

    const response = await fetch('/api/mn/loadxml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.value,
      },
      body: JSON.stringify(payload),
    });
    // get response data and check if response is ok then commit to store
    const resp = await response.json();
    if (!response.ok) {
      sentRequest.value = false;
      throw new Error(resp.message);
    }

    const data = resp?.response ?? {};
    store.commit('explorer/setDynamfitDomain', selectedProperty.value);
    store.commit('explorer/setDynamfitData', data);
    sentRequest.value = false;
  } catch (err) {
    sentRequest.value = false;
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 1000,
    });
  }
};

const search = async (): Promise<void> => {
  const payload = {
    has: selectedProperty.value,
    limit: limit.value || 2,
    page: currentPage.value,
  };
  try {
    const response = await fetch('/api/xml/xml-has-property', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.value,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    results.value = data;
    totalPages.value = Math.ceil(data.counts / limit.value);
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 10000,
    });
  }
};

const goToPage = async (page: number): Promise<void> => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  await search();
};

// Watchers
watch(transformMethod, (newValue) => {
  store.commit(
    'explorer/setDynamfitTransformMethod',
    newValue as 'none' | 'WLF' | 'hybrid' | 'manual'
  );
});

watch(
  dynamfit,
  (newVal) => {
    if (!newVal) return;
    updateChart();
  },
  { deep: true }
);

watch(limit, () => {
  return search();
});

watch([tgEstimated, c1Estimated, c2Estimated, tLEstimated, eAEstimated], (cv, ov) => {
  // nTgE = new Tg Estimated
  if (cv[0] && cv[0] === true) ttspTgValue.value = null;
  if (cv[1] && cv[1] === true) ttspC1Value.value = null;
  if (cv[2] && cv[2] === true) ttspC2Value.value = null;
  if (cv[3] && cv[3] === true) ttspTLValue.value = null;
  if (cv[4] && cv[4] === true) ttspEAValue.value = null;
});
</script>
