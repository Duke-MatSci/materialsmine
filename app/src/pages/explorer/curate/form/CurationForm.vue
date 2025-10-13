<template>
  <div class="viz-u-postion__rel">
    <div class="section_loader u--margin-toplg" v-if="loading && !error">
      <spinner :loading="loading" :text="loadingText" />
    </div>

    <div
      v-else-if="error && !loading"
      class="utility-roverflow u_centralize_text u_margin-top-med"
    >
      <h1 class="visualize_header-h1 u--margin-topxl">Unable to load form</h1>
      <md-button
        class="md-fab md-fab-top-right md-dense btn--primary"
        @click.prevent="navBack"
      >
        <md-tooltip> Go Back </md-tooltip>
        <md-icon>arrow_back</md-icon>
      </md-button>
    </div>

    <div
      v-else
      class="curate u_margin-top-med u--padding-zero-mobile"
      @click="disableRender"
    >
      <form ref="curationForm" @submit.prevent="submit" class="modal-content">
        <md-steppers
          v-if="!!titles.length"
          v-model:md-active-step="active"
          @md-changed="(e) => sortCurate(e)"
          class="form__stepper form__stepper-curate"
        >
          <md-step
            v-for="(title, id) in titles"
            :md-error="hasProperty(errors, title) ? 'Missing field' : null"
            :id="`stepper_${id}`"
            :key="`stepper_${id}`"
            :md-label="title"
          >
            <template v-if="active === `stepper_${id}`">
              <!-- NavBar and Dropdown  -->
              <div
                v-if="active !== ''"
                class="md-layout md-gutter md-alignment-center-space-between"
                style="position: relative"
              >
                <div>
                  <CurateNavBar
                    :active="isEditMode ? 'Edit Curation' : 'Curation Form'"
                    :navRoutes="navRoutes"
                  />
                </div>

                <div
                  class="u--layout-flex section_md-header md-layout-item md-size-40 md-small-size-75 md-xsmall-size-75 u_height--auto u--margin-left-auto"
                >
                  <md-field>
                    <md-select
                      v-model="active"
                      name="sheet"
                      :id="`sNR_${id}`"
                      md-dense
                    >
                      <md-option
                        v-for="(title, title_id) in titles"
                        :key="`sRO_${title_id}`"
                        :value="`stepper_${title_id}`"
                        >{{ title }}</md-option
                      >
                    </md-select>
                  </md-field>

                  <md-field md-dense class="u--margin-leftsm u--margin-none">
                    <md-input
                      v-model="searchKeyword"
                      name="searchKeyword"
                      id="searchKeyword"
                      placeholder="Search Fields"
                    ></md-input>
                    <md-icon>search</md-icon>
                  </md-field>
                </div>
                <template v-if="!!searchResult.length && showDropdown">
                  <div
                    class="search-dropdown-menu u_searchimage_form-group"
                    :style="setDropdownPosition"
                  >
                    <button
                      v-for="(item, index) in searchResult"
                      :key="index"
                      @click.prevent="showInputLocation(item)"
                      style="white-space: wrap"
                      class="btn-text md-button-clean viz-u-display__show u_width--max md-card-actions search_box_form_label u_pointer"
                    >
                      <template v-for="(level, l_id) in item">
                        <span v-if="item.length - 1 !== l_id" :key="l_id">
                          {{ level }} >>
                        </span>
                        <span v-else :key="level">
                          <strong>{{ level }}</strong></span
                        >
                      </template>
                    </button>
                  </div>
                </template>
              </div>

              <!-- Vertical Steppers  -->
              <md-steppers
                v-if="!!tempInputObj[title].length"
                v-model:md-active-step="verticalActive"
                md-vertical
                md-dynamic-height
              >
                <md-step
                  v-for="step in Math.ceil(tempInputObj[title].length / 5)"
                  :md-error="
                    vStepError[title].includes(step) ? 'Field Error' : null
                  "
                  :id="`v_${step}`"
                  :key="`v_${step}`"
                  :md-label="`${title}`"
                >
                  <div
                    v-if="!!tempInputObj[title].length"
                    class="md-layout md-gutter md-alignment-center-center"
                  >
                    <template v-if="verticalActive === `v_${step}`">
                      <div
                        v-for="(item, id) in tempInputObj[title].slice(
                          (step - 1) * 5,
                          step * 5
                        )"
                        :key="`form_${id}`"
                        :class="[
                          item.detail.type === 'multiples'
                            ? 'md-size-80 md-medium-size-90'
                            : inputSizesm,
                          'md-layout-item md-xsmall-size-95 u_height--auto'
                        ]"
                      >
                        <!-- Form Input Field Name  -->
                        <div class="md-layout md-alignment-center-left">
                          <p
                            v-if="item.detail.type !== 'multiples'"
                            class="md-body-2"
                          >
                            {{
                              item.ref[item.ref.length - 2] ||
                              item.ref[item.ref.length - 1]
                            }}
                          </p>
                        </div>

                        <!-- For handling general case types i.e list, string, file -->
                        <template
                          v-if="
                            item.detail.type !== 'multiples' &&
                            item.detail.type !== 'varied_multiples'
                          "
                        >
                          <InputComponent
                            @update-step-error="updateStepError(title, step)"
                            :title="title"
                            :name="item.name"
                            :uniqueKey="item.ref"
                            :inputObj="item.detail"
                          />
                        </template>

                        <!-- For handling varied_multiples -->
                        <template
                          v-if="item.detail.type === 'varied_multiples'"
                        >
                          <div class="md-card-actions u--padding-zero">
                            <md-field md-dense :style="reduceSpacing">
                              <md-select
                                md-dense
                                v-model="item.detail.cellValue"
                                :name="`${item.ref}_${item.name}`"
                                :id="`${item.ref}_${item.name}`"
                                :placeholder="`Please Choose Parameter`"
                                @md-opened="
                                  fetchListValues(item.detail.validList)
                                "
                                @md-selected="
                                  sort_variedMultiple_alt(
                                    title,
                                    item.detail.values,
                                    item.ref
                                  )
                                "
                              >
                                <md-option disabled>Select Options</md-option>
                                <md-option
                                  v-if="
                                    !!item.detail.cellValue && !listItems.length
                                  "
                                  :value="item.detail.cellValue"
                                  >{{ item.detail.cellValue }}</md-option
                                >
                                <md-option
                                  v-for="(listItem, listId) in listItems"
                                  :key="listId"
                                  :value="listItem"
                                  >{{ listItem }}</md-option
                                >
                              </md-select>
                            </md-field>
                            <md-button
                              v-if="!!item.detail.cellValue && !isEditMode"
                              @click="
                                addVariedMultiple(
                                  title,
                                  item.detail.values,
                                  item.ref
                                )
                              "
                              class="md-icon-button u_margin-bottom-med"
                            >
                              <md-tooltip md-direction="top"
                                >Add New {{ item.name }}</md-tooltip
                              >
                              <md-icon>add</md-icon>
                            </md-button>
                          </div>
                        </template>
                        <!-- For handling type multiples -->
                        <template>
                          <MultipleInputComponent
                            @update-step-error="updateStepError(title, step)"
                            :title="title"
                            v-if="item.detail.type === 'multiples'"
                            :name="item.name"
                            :uniqueKey="item.ref"
                            :inputObj="item.detail"
                          />
                        </template>
                      </div>
                    </template>
                  </div>

                  <div class="dialog-box_actions">
                    <md-dialog-actions>
                      <button
                        class="md-button btn btn--noradius"
                        v-if="step > 1"
                        @click.prevent="goToStep(`v_${step--}`, `v_${step++}`)"
                      >
                        Previous
                      </button>
                      <button
                        class="md-button btn btn--tertiary btn--noradius"
                        v-if="step < Math.ceil(tempInputObj[title].length / 5)"
                        @click.prevent="verticalActive = `v_${step + 1}`"
                      >
                        Next
                      </button>
                    </md-dialog-actions>
                  </div>
                </md-step>
              </md-steppers>

              <div class="md-dialog-actions">
                <button
                  v-if="id > 0"
                  class="md-button btn btn--noradius"
                  @click.prevent="active = `stepper_${id - 1}`"
                >
                  Previous Step
                </button>
                <button
                  v-if="id < titles.length - 1"
                  class="md-button btn btn--tertiary btn--noradius"
                  @click.prevent="active = `stepper_${id + 1}`"
                >
                  Next Step
                </button>
                <button
                  @click.prevent="(e) => openDialogBox()"
                  class="md-button btn btn--primary btn--noradius"
                >
                  Submit
                </button>
              </div>
            </template>
          </md-step>
        </md-steppers>
      </form>

      <!-- Center Stepper  -->
      <div
        v-if="active === ''"
        class="u--margin-toplg spinner md-layout md-gutter md-alignment-center-center"
      >
        <div
          class="md-layout-item md-size-40 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
        >
          <md-field>
            <label for="sNC">Please choose a sheet name</label>
            <md-select v-model="active" name="sheet" id="sNC">
              <md-option
                v-for="(title, id) in titles"
                :key="`sCO${id}`"
                :value="`stepper_${id}`"
                >{{ title }}</md-option
              >
            </md-select>
          </md-field>
        </div>
      </div>

      <!-- Dialog Box -->
      <dialog-box :minWidth="40" :active="dialogBoxActive">
        <template v-slot:title>Alert</template>
        <template v-slot:content>{{ dialogBoxText }}</template>
        <template v-slot:actions>
          <md-button @click.prevent="closeDialogBox">No</md-button>
          <md-button @click.prevent="confirmAction">Yes</md-button>
        </template>
      </dialog-box>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStore } from 'vuex';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import InputComponent from '@/components/explorer/InputComponent.vue';
import DialogBox from '@/components/Dialog.vue';
import Spinner from '@/components/Spinner.vue';
import MultipleInputComponent from '@/components/explorer/MultipleInputComponent.vue';

// Component name for debugging
defineOptions({
  name: 'CurationForm'
});

// Router and store
const route = useRoute();
const router = useRouter();
const store = useStore();

// Interfaces
interface NavRoute {
  label: string;
  path: string;
}

interface InputDetail {
  type: string;
  cellValue?: any;
  values?: any[];
  required?: boolean;
  validList?: string;
  edited?: boolean;
}

interface TempInputItem {
  detail: InputDetail;
  name: string;
  ref: string[];
}

interface TempInputObj {
  [key: string]: TempInputItem[];
}

interface VStepError {
  [key: string]: number[];
}

// Refs
const curationForm = ref<HTMLFormElement | null>(null);
const editRouteParent = ref<NavRoute[]>([
  {
    label: 'Curate',
    path: '/explorer/curate'
  },
  {
    label: 'Curation Form',
    path: '/explorer/curate/stepper'
  }
]);
const tempInputObj = ref<TempInputObj>({});
const vStepError = ref<VStepError>({});
const titles = ref<string[]>([]);
const listItems = ref<any[]>([]);
const loadingList = ref<boolean>(false);
const loading = ref<boolean>(true);
const loadingText = ref<string>('Loading Curation Form');
const error = ref<boolean>(false);
const active = ref<string>('');
const verticalActive = ref<string>('v_1');
const dialogBoxText = ref<string>('');
const dialogBoxAction = ref<(() => void) | null>(null);
const searchKeyword = ref<string>('');
const searchResult = ref<any[]>([]);
const showDropdown = ref<boolean>(false);
const resetVStep = ref<boolean>(true);

// Computed
const curate = computed(() => store.state.explorer.curation.curationFormData);
const errors = computed(() => store.state.explorer.curation.curationFormError);
const dialogBoxActive = computed(() => store.getters.dialogBox);

const reduceSpacing = computed(() => {
  return { alignItems: 'baseline', minHeight: 'auto', paddingTop: 0 };
});

const setDropdownPosition = computed(() => {
  return { top: 100 + '%', zIndex: 10, right: 0, minHeight: 'auto' };
});

const inputSizesm = computed(() => {
  return 'md-size-40 md-medium-size-45 md-small-size-50 ';
});

const isEditMode = computed(() => {
  return !!Object.keys(route.query).length;
});

const navRoutes = computed(() => {
  if (isEditMode.value) return [...editRouteParent.value];
  return [editRouteParent.value[0]];
});

// Methods
const hasProperty = (obj: any, prop: string): boolean => {
  return Object.hasOwnProperty.call(obj, prop);
};

const navBack = (): void => {
  router.back();
};

const searchCurationForm = (): void => {
  searchResult.value = [];
  if (searchKeyword.value.length < 3) return;
  const results: any[] = [];
  const regex = new RegExp(searchKeyword.value, 'gi');
  for (const key in tempInputObj.value) {
    const arr = tempInputObj.value[key];
    for (let i = 0; i < arr.length; i++) {
      if (
        !!arr[i].ref.length &&
        !!arr[i].ref.find((e) => e.search(regex) !== -1)
      ) {
        results.push([key, ...arr[i].ref]);
      }
    }
  }
  searchResult.value = results;
  showDropdown.value = true;
};

const showInputLocation = async (arr: any[] = [], title: string | null = null): Promise<void> => {
  resetVStep.value = false;
  await nextTick();
  const ref = arr;
  const formTitle = !title ? ref.shift() : title;
  const formArr = tempInputObj.value[formTitle];
  const matchIndex = formArr.findIndex(
    (currVal) => JSON.stringify(currVal.ref) === JSON.stringify([...ref])
  );
  const hIndex = titles.value.findIndex((val) => val === formTitle);
  const vIndex = Math.floor(matchIndex / 5) + 1;
  await nextTick();
  active.value = `stepper_${hIndex}`;
  verticalActive.value = `v_${vIndex}`;
  searchKeyword.value = '';
};

const disableRender = async (e: Event): Promise<void> => {
  const target = e.target as HTMLElement;
  const selected = target.closest('.search_box');
  if (!selected) {
    showDropdown.value = false;
  }
};

const closeDialogBox = (): void => {
  if (dialogBoxActive.value) {
    store.commit('setDialogBox');
  }
  dialogBoxText.value = '';
  dialogBoxAction.value = null;
};

const updateStepError = (title: string, step: number): void => {
  if (!vStepError.value[title].includes(step)) {
    vStepError.value[title].push(step);
  }
};

const checkErrorsLocation = (): void => {
  for (let i = 0; i < titles.value.length; i++) {
    if (hasProperty(errors.value, titles.value[i])) {
      showErrorsLocation(
        titles.value[i],
        errors.value[titles.value[i]],
        []
      );
    }
  }
};

const showErrorsLocation = (title: string, obj: any, ref: string[] = []): void => {
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      for (let i = 0; i < obj[key].length; i++) {
        showErrorsLocation(title, obj[key][i], [...ref, key]);
      }
    } else if (typeof obj[key] === 'object') {
      showErrorsLocation(title, obj[key], [...ref, key]);
    } else {
      const arr = tempInputObj.value[title];
      let matchIndex = arr.findIndex(
        (currVal) =>
          JSON.stringify(currVal.ref) === JSON.stringify([...ref, key])
      );
      if (matchIndex === -1) {
        matchIndex = arr.findIndex(
          (currVal) =>
            JSON.stringify(currVal.ref) === JSON.stringify([...ref])
        );
      }
      if (matchIndex < 5 && matchIndex !== -1) {
        updateStepError(title, 1);
      } else if (matchIndex !== -1) {
        updateStepError(title, Math.floor(matchIndex / 5) + 1);
      }
    }
  }
};

const submitForm = (): void => {
  submit();
  closeDialogBox();
};

const submit = async (): Promise<void> => {
  loading.value = true;
  error.value = false;
  loadingText.value = 'Uploading Data Entry';
  for (let i = 0; i < titles.value.length; i++) {
    vStepError.value[titles.value[i]] = [];
  }
  try {
    await validateForm(tempInputObj.value);
    if (isEditMode.value) {
      const query = route.query;
      await store.dispatch('explorer/curation/submitCurationData', {
        xlsxObjectId: query?.id,
        isNew: query?.isNew
      });
    } else {
      await store.dispatch('explorer/curation/submitCurationData');
    }
  } catch (err: any) {
    if (Object.keys(errors.value).length) checkErrorsLocation();
    store.commit('setSnackbar', {
      message: err?.message ?? 'Something went wrong',
      action: () => submit()
    });
  } finally {
    loading.value = false;
  }
};

const isFieldEmpty = (obj: InputDetail): boolean => {
  return obj.type === 'replace_nested'
    ? !obj.values?.length
    : !obj.cellValue;
};

const validateForm = async (obj: TempInputObj): Promise<void> => {
  store.commit('explorer/curation/setCurationFormError', {});
  const errorObj: any = {};
  for (const key in obj) {
    const arr = obj[key];
    for (let i = 0; i < arr.length; i++) {
      const detail = obj[key][i]?.detail ?? {};
      if (detail.required) {
        if (isFieldEmpty(detail)) {
          errorObj[key] = hasProperty(errorObj, key)
            ? errorObj[key]
            : {};
          const refArr = obj[key][i]?.ref || [];
          if (!refArr.length) {
            errorObj[key] = `${obj[key][i].name} is a required field`;
          } else {
            refArr.reduce(function (o: any, x: string, index: number) {
              return index === refArr.length - 1
                ? (o[x] = `${obj[key][i].name} is a required field`)
                : (o[x] = typeof o[x] === 'object' ? o[x] : {});
            }, errorObj[key]);
          }
        }
      }
    }
  }

  store.commit('explorer/curation/setCurationFormError', errorObj);
};

const goToStep = (id: string, index?: string): void => {
  if (index) verticalActive.value = index;
};

const fetchListValues = async (arg: string): Promise<void> => {
  listItems.value = [];
  loadingList.value = true;
  try {
    const result = await store.dispatch('explorer/curation/fetchXlsList', { field: arg });
    listItems.value = result?.columns[0]?.values || [];
  } catch (err) {
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => fetchListValues(arg)
    });
  } finally {
    loadingList.value = false;
  }
};

const fetchParameterValues = (arr: any[] = []): void => {
  listItems.value = [];
  const data = arr.reduce((acc, val) => acc.concat(Object.keys(val)), []);
  listItems.value = data;
};

const sortCurate = (arg: string): void => {
  const id = arg.slice(-1);
  verticalActive.value = resetVStep.value ? 'v_1' : verticalActive.value;
  resetVStep.value = true;
  if (!tempInputObj.value[titles.value[Number(id)]].length) {
    return filterData(
      titles.value[Number(id)],
      curate.value[titles.value[Number(id)]],
      []
    );
  }
};

const sort_variedMultiple_alt = (title: string, arr: any[], parent: string[]): void => {
  for (let i = 0; i < arr.length; i++) {
    if (hasProperty(arr[i], 'ChooseParameter')) {
      const ref = [...parent, 'ChooseParameter'];
      tempInputObj.value[title].push({
        detail: arr[i].ChooseParameter,
        name: 'ChooseParameter',
        ref: ref
      });
    }
  }
};

const addVariedMultiple = (title: string, arr: any[], parent: string[]): void => {
  const obj = JSON.parse(JSON.stringify(arr[0]));
  clearFields(obj);
  const refArr = parent || [];
  const refData = refArr.reduce(function (o: any, x: string) {
    return typeof o === 'undefined' || o === null ? o : o[x];
  }, curate.value[title]);

  if (
    hasProperty(refData, 'values') &&
    Array.isArray(refData?.values)
  ) {
    refData.values.push(obj);
    const length = refData.values.length;
    sort_variedMultiple_alt(
      title,
      [refData.values[length - 1]],
      parent
    );
  }
};

const filterData = (title: string, obj: any, parent: string[] = []): void => {
  if (
    hasProperty(obj, 'type') &&
    hasProperty(obj, 'cellValue') &&
    !parent.length
  ) {
    obj.cellValue = route?.query?.id ? obj.cellValue : null;
    return tempInputObj.value[title].push({
      detail: obj,
      name: title,
      ref: [...parent, title]
    });
  }
  for (const prop in obj) {
    const ref = parent;
    if (!obj[prop]?.type && typeof (obj[prop] === 'object')) {
      filterData(title, obj[prop], [...parent, prop]);
    } else {
      if (
        obj[prop].type === 'replace_nested' &&
        !hasProperty(obj[prop], 'edited')
      ) {
        obj[prop].values = route?.query?.id ? obj[prop].values : [];
        store.commit('explorer/curation/setReplaceNestedRef', [
          title,
          ...ref,
          prop
        ]);
      } else if (
        obj[prop].type === 'multiples' &&
        !route?.query?.id
      ) {
        clearFields(obj[prop]);
      } else if (!route?.query?.id) {
        obj[prop].cellValue = null;
      }
      tempInputObj.value[title].push({
        detail: obj[prop],
        name: prop,
        ref: [...ref, prop]
      });
      if (
        obj[prop].type === 'varied_multiples' &&
        !route?.query?.id
      ) {
        clearFields(obj[prop]);
      }
      if (
        obj[prop].type === 'varied_multiples' &&
        !!route?.query?.id &&
        !!obj[prop].cellValue
      ) {
        sort_variedMultiple_alt(title, obj[prop].values, [
          ...ref,
          prop
        ]);
      }
    }
  }
};

const clearFields = (obj: any): void => {
  if (hasProperty(obj, 'type')) {
    if (obj.type === 'multiples' || obj.type === 'varied_multiples') {
      const arr = obj.values;
      for (let i = 0; i < arr.length; i++) {
        clearFields(arr[i]);
      }
    } else if (obj.type === 'replace_nested') {
      obj.values = [];
    } else {
      obj.cellValue = null;
    }
  } else {
    for (const key in obj) {
      clearFields(obj[key]);
    }
  }
};

const filterCurationData = (): void => {
  titles.value = Object.keys(curate.value).filter((word) => word !== 'ID');
  if (!isEditMode.value) clearFields(curate.value.ID);
  const objArr: TempInputObj = {};
  const errArr: VStepError = {};
  for (let i = 0; i < titles.value.length; i++) {
    objArr[titles.value[i]] = [];
    errArr[titles.value[i]] = [];
    vStepError.value = Object.assign({}, vStepError.value, errArr);
    tempInputObj.value = Object.assign({}, tempInputObj.value, objArr);
    filterData(titles.value[i], curate.value[titles.value[i]], []);
  }
};

const fetchCurationData = async (): Promise<void> => {
  loading.value = true;
  error.value = false;
  loadingText.value = 'Loading Curation Form';
  const query = route.query;
  store.commit('explorer/curation/clearReplaceNestedRef');
  try {
    const arg = isEditMode.value
      ? { isNew: query.isNew, id: query.id }
      : null;
    if (
      isEditMode.value &&
      (!hasProperty(query, 'isNew') || !hasProperty(query, 'id'))
    ) {
      throw new Error('Incorrect Route Parameters');
    }
    await store.dispatch('explorer/curation/fetchCurationData', arg);
    filterCurationData();
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => fetchCurationData()
    });
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const resetState = (): void => {
  loading.value = true;
  tempInputObj.value = {};
  vStepError.value = {};
  titles.value = [];
  active.value = '';
  verticalActive.value = 'v_1';
  dialogBoxText.value = '';
  dialogBoxAction.value = null;
  store.commit('explorer/curation/setCurationFormData', {});
  store.commit('explorer/curation/setCurationFormError', {});
  store.commit('explorer/curation/clearReplaceNestedRef');
};

const openDialogBox = (msg: string | null = null, func: (() => void) | null = null): void => {
  dialogBoxText.value = !msg ? 'Are you sure you want to submit?' : msg;
  dialogBoxAction.value = !func ? () => submitForm() : func;
  if (!dialogBoxActive.value) {
    store.commit('setDialogBox');
  }
};

const confirmAction = (): void => {
  if (dialogBoxAction.value) {
    dialogBoxAction.value();
    closeDialogBox();
  }
};

// Watch
watch(searchKeyword, (newVal) => {
  if (newVal) {
    searchCurationForm();
  }
});

// Lifecycle
onMounted(async () => {
  store.commit('explorer/curation/setDatasetId', null);
  await fetchCurationData();
  !isEditMode.value && (await store.dispatch('explorer/curation/createControlId'));
});

// Navigation Guard
onBeforeRouteLeave((to, _, next) => {
  let msg = '';
  if (to.name === 'XmlVisualizer') return next();
  if (error.value) return next();
  if (to.path === '/explorer/curate/stepper') {
    msg =
      'Do you want to create a new curation? You would lose any unsaved changes!';
    return openDialogBox(msg, () => {
      next();
      resetState();
      fetchCurationData();
    });
  }
  msg = 'Do you really want to leave? You would lose any unsaved changes!';
  return openDialogBox(msg, () => {
    next();
    resetState();
  });
});
</script>
