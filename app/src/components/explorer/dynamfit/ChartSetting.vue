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
        <template>
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
        </template>
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
              <h3 v-if="results.counts > limit">
                Results ({{ currentPage * limit }} of {{ results.counts }})
              </h3>
              <h3 v-else>Results ({{ currentPage }} of {{ results.counts }})</h3>
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
                    :id="index"
                    :value="{ ...item, index: index }"
                    v-model="selectedItemProperty"
                    style="accent-color: #09233c"
                  />
                  <label :for="item"
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
    <div>
      <label for="fitSettings" class="md-body-2">Additional Settings</label>
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
    <div class="grid grid_col-2">
      <div class="">
        <a
          v-if="!dynamfit.fileUpload.length"
          class="btn-text"
          style="border-radius: 0% !important"
          href="#"
          @click="useSampleFile"
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
import { useOptionalChaining } from '@/composables/useOptionalChaining';
import Pagination from '@/components/explorer/Pagination.vue';

// Component name for debugging
defineOptions({
  name: 'ChartSetting',
});

// Store
const store = useStore();

// Composables
const { optionalChaining } = useOptionalChaining();

// Reactive data
const showToolTip = ref(false);
const isTemp = ref(true);
const useSample = ref(false);
const isSidebarOpen = ref(false);
const selectedProperty = ref('select');
const limit = ref(2);
const results = ref<any[]>([]);
const currentItem = ref<any>(null);
const selectedItemProperty = ref<any>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const stepper = ref(1);
const dataType = ref<string | undefined>(undefined);

// Computed properties
const dynamfit = computed(() => store.state.explorer.dynamfit);
const token = computed(() => store.getters['auth/token']);

const disableInput = computed(() => {
  return !dynamfitData.value || !Object.keys(dynamfitData.value).length;
});

const dynamfitData = computed(() => {
  return store.getters['explorer/getDynamfitData'];
});

const updateControls = computed(() => {
  return !!dynamfit.value.fileUpload || !!results.value?.xmls?.length;
});

// Watch for changes
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

// Methods
// const updateView = () => {};

const resetAll = () => {
  closeSidebar();
  resetChart();
  selectedProperty.value = 'select';
  currentItem.value = null;
  selectedItemProperty.value = null;
  currentPage.value = 1;
  totalPages.value = 0;
  results.value = [];
  stepper.value = 1;
  dataType.value = undefined;
};

const selectType = (type: string) => {
  stepper.value = 3;
  dataType.value = type;
};

const increaseStepper = () => {
  stepper.value++;
};

const decreaseStepper = () => {
  stepper.value--;
};

const sampleTitle = () => {
  return `An example set of E', E" data for PMMA which can be used to explore the Prony Series fitting and conversion tool.`;
};

const downloadTitle = () => {
  return `An example tsv file of 3 columns containing: frequency, E', E"; no header row. Format your data as this template then 'upload file' to use the Prony Series fitting and conversion tool.`;
};

const onInputChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  useSample.value = false;
  displayInfo('Uploading File...');
  const file = [...(target.files || [])];
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
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => onInputChange(e),
    });
  }
};

const useSampleFile = async () => {
  closeSidebar();
  useSample.value = true;
  displayInfo('Using sample file', 1500);
  dynamfit.value.fileUpload = 'test.tsv';
};

const resetChart = async () => {
  const name = dynamfit.value.fileUpload || selectedItemProperty.value?.index;
  if (!name) return;

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

  // TODO: WILL NEED TO FIX THIS LATER!
  // store.commit('setSnackbar', {
  //   message: error ?? 'Something went wrong',
  //   action: () => resetChart()
  // })
};

const displayInfo = (msg: string, duration?: number) => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000,
    });
  }
};

const clearDynamfitData = () => {
  // First reset useSample flag if in use
  useSample.value = false;
  store.commit('explorer/resetDynamfit');
  store.commit('explorer/resetDynamfitData');
};

const updateChart = async () => {
  // If user is exploring XML
  if (selectedItemProperty.value?.index >= 0) {
    console.log('Selected item property:', selectedItemProperty.value);
    return await handleSelect();
  }

  const payload = {
    fileName: dynamfit.value.fileUpload,
    numberOfProny: dynamfit.value.range,
    model: dynamfit.value.model,
    fitSettings: dynamfit.value.fitSettings,
    useSample: useSample.value,
    domain: selectedProperty.value,
  };

  isSidebarOpen.value = false;
  store.commit('explorer/setDynamfitDomain', selectedProperty.value);
  await store.dispatch('explorer/fetchDynamfitData', payload);
};

const openSidebar = () => {
  isSidebarOpen.value = true;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const goBack = () => {
  currentItem.value = null;
  selectedItemProperty.value = null;
};

const handleSelect = async () => {
  if (!selectedItemProperty.value) {
    store.commit('setSnackbar', {
      message: 'Please select an item before proceeding.',
      type: 'error',
      duration: 4000,
    });
    return;
  }

  isSidebarOpen.value = false;
  try {
    const payload = {
      id: currentItem.value.id,
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
      throw new Error(resp.message);
    }

    const data = resp?.response ?? {};
    store.commit('explorer/setDynamfitDomain', selectedProperty.value);
    store.commit('explorer/setDynamfitData', data);
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 1000,
    });
  }
};

const search = async () => {
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
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 10000,
    });
  }
};

const goToPage = async (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  await search();
};
</script>
