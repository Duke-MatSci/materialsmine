<template>
  <div class="spreadsheet_list_form section_teams">
    <div>
      <div style="max-width: 99%">
        <div class="md-layout md-alignment-top-center">
          <div
            class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
          >
            <CurateNavBar active="" />
          </div>
        </div>
      </div>
      <h1 class="visualize_header-h1 article_title u_centralize_text">Update Valid List</h1>
      <div style="max-width: 99%">
        <div class="md-layout md-gutter md-alignment-top-center">
          <div
            class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
          >
            <div>
              <md-table
                v-if="!!spreadsheetList.length && !editMode"
                v-model="spreadsheetList"
                @md-selected="onSelect"
              >
                <md-table-toolbar><h1 class="md-title">Search Results</h1></md-table-toolbar>
                <md-table-row slot="md-table-row" slot-scope="{ item }" md-selectable="single">
                  <md-table-cell md-label="Field Name">{{ item.field }}</md-table-cell>
                  <md-table-cell md-label="Value">
                    <md-chip
                      class="u_margin-bottom-small"
                      v-for="(element, i) in item['values']"
                      :key="`C${i}`"
                      >{{ element }}</md-chip
                    >
                  </md-table-cell>
                  <md-table-cell md-label="User">{{ item.user ?? '' }}</md-table-cell>
                </md-table-row>
              </md-table>

              <md-table v-if="editMode & !Object.keys(uploadedData).length">
                <md-table-row>
                  <md-table-head>Field Name</md-table-head>
                  <md-table-head>Value</md-table-head>
                </md-table-row>

                <md-table-row>
                  <md-table-cell>{{ fieldName }}</md-table-cell>
                  <md-table-cell>
                    <md-chip
                      class="u_margin-bottom-small"
                      v-for="(element, i) in value"
                      @md-delete="deleteValue(value, i)"
                      md-deletable
                      :key="`${i}`"
                      >{{ element }}</md-chip
                    >
                  </md-table-cell>
                </md-table-row>
              </md-table>

              <md-table v-if="!!Object.keys(uploadedData).length">
                <md-table-toolbar
                  ><h1 class="md-title u--color-success">Update Successful</h1></md-table-toolbar
                >

                <md-table-row>
                  <md-table-head>Field Name</md-table-head>
                  <md-table-head>Value</md-table-head>
                  <md-table-head>User</md-table-head>
                </md-table-row>

                <md-table-row>
                  <md-table-cell>{{ uploadedData.field }}</md-table-cell>
                  <md-table-cell>
                    <md-chip
                      class="u_margin-bottom-small"
                      v-for="(element, i) in uploadedData['values']"
                      :key="`${i}`"
                      >{{ element }}</md-chip
                    >
                  </md-table-cell>
                  <md-table-cell>{{ uploadedData.user ?? '' }}</md-table-cell>
                </md-table-row>
              </md-table>
            </div>

            <div>
              <md-field style="align-items: baseline">
                <p style="margin-right: 4px; font-weight: bold">Field Name:</p>
                <md-input v-model="fieldName" @keyup.enter="submitSearch" id="fieldName"></md-input>
              </md-field>

              <md-field style="align-items: baseline">
                <p style="margin-right: 4px; font-weight: bold">Value:</p>
                <md-input
                  v-model="currValue"
                  @keyup.enter="insertValue"
                  :disabled="!editMode && !Object.keys(uploadedData).length"
                  id="fieldValue"
                ></md-input>
                <md-button class="md-icon-button md-dense" @click="insertValue">
                  <md-icon>add</md-icon>
                </md-button>
              </md-field>

              <div class="form__group search_box_form-item-2 explorer_page-nav u_margin-top-med">
                <button
                  type="submit"
                  class="btn btn--tertiary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="submitSearch"
                >
                  Search
                </button>

                <button
                  type="submit"
                  class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="update"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  SEARCH_SPREADSHEETLIST_QUERY,
  UPDATE_SPREADSHEETLIST,
} from '@/modules/gql/metamaterial-gql';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';

defineOptions({
  name: 'SpreadsheetUpdate',
});

const store = useStore();

// Reactive data
const loading = ref(false);
const pageNumber = ref(1);
const searchMode = ref(true);
const editMode = ref(false);
const spreadsheetList = ref<any[]>([]);
const uploadedData = ref<any>({});
const fieldName = ref('');
const currValue = ref('');
const value = ref<any[]>([]);

// Computed properties
const searchValue = computed(() => {
  return fieldName.value.trim().split(' ').join('_');
});

const fieldNameSelected = computed(() => {
  return store.getters['explorer/curation/getFieldNameSelected'];
});

// GraphQL queries and mutations
const {
  result: searchResult,
  loading: searchLoading,
  refetch: refetchSearch,
} = useQuery(
  SEARCH_SPREADSHEETLIST_QUERY,
  () => ({
    input: {
      field: searchValue.value,
      pageNumber: pageNumber.value,
      pageSize: 20,
    },
  }),
  () => ({
    fetchPolicy: 'no-cache',
    enabled: false, // We'll trigger this manually
  })
);

const { mutate: updateMutation, loading: updateLoading } = useMutation(UPDATE_SPREADSHEETLIST);

// Methods
const resetState = () => {
  spreadsheetList.value = [];
  uploadedData.value = {};
  value.value = [];
  currValue.value = '';
};

const onSelect = (item: any) => {
  if (item) {
    fieldName.value = item.field;
    value.value = item.values;
    editMode.value = true;
  }
};

const insertValue = () => {
  if (!currValue.value.trim().length) return;
  if (!value.value.includes(currValue.value.trim())) {
    value.value.push(currValue.value);
    currValue.value = '';
    return;
  }
  store.commit('setSnackbar', {
    message: 'Duplicate Value Entered',
    duration: 3000,
  });
};

const deleteValue = (arr: any[], e: number) => {
  arr.splice(e, 1);
};

const submitSearch = async () => {
  if (!fieldName.value.trim()) return;
  const searchValue = searchValue.value;
  searchMode.value = false;

  try {
    const response = await refetchSearch();
    if (!response) {
      const error = new Error('Something went wrong!');
      throw error;
    }
    const result = response?.data?.getXlsxCurationList;
    resetState();
    editMode.value = false;
    spreadsheetList.value = result.columns || [];
    value.value = [];
    pageNumber.value = result.pageNumber || 1;
  } catch (error: any) {
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => submitSearch(),
    });
    searchMode.value = true;
  }
};

const update = async () => {
  if (!!fieldName.value && !value.value.length) {
    return store.commit('setSnackbar', {
      message: 'Field Value Required',
      duration: 2500,
    });
  }

  try {
    const response = await updateMutation({
      input: { field: searchValue.value, values: value.value },
    });
    uploadedData.value = { ...response.data.updateXlsxCurationList };
    store.commit('setSnackbar', {
      message: 'Update Successful',
      duration: 4000,
    });
  } catch (error: any) {
    if (error.message.search(/not authenticated/i) !== -1) {
      return store.commit('setSnackbar', {
        message: error.message ?? 'Something went wrong',
        duration: 5000,
      });
    }
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => update(),
    });
  }
};

onMounted(async () => {
  // Check store. Indicates update came from 'all' list
  if (fieldNameSelected.value) {
    editMode.value = true;
    fieldName.value = fieldNameSelected.value;
    await submitSearch();
    if (spreadsheetList.value.length) {
      onSelect(spreadsheetList.value[0]);
    }
  }
});
</script>
