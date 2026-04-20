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
      <h1 class="visualize_header-h1 article_title u_centralize_text">
        All Current Valid Entries
      </h1>
      <div style="max-width: 99%">
        <div class="md-layout md-gutter md-alignment-top-center">
          <div
            class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
          >
            <div v-if="!!getXlsxCurationList?.columns">
              <md-field style="align-items: baseline">
                <p style="margin-right: 4px; font-weight: bold">
                  <md-icon>search</md-icon>
                </p>
                <label style="margin-left: 2.5rem">Search Entries</label>
                <md-input
                  v-model="fieldName"
                  @keyup.enter="submitSearch"
                  id="fieldName"
                ></md-input>
              </md-field>
              <div class="form__group explorer_page-nav u--margin-neg">
                <button
                  type="submit"
                  class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="submitSearch"
                >
                  Search
                </button>
                <button
                  v-if="searchMode"
                  class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="clearInput"
                >
                  Clear
                </button>
              </div>
              <md-table
                v-model="getXlsxCurationList.columns"
                md-sort="name"
                md-sort-order="asc"
              >
                <template #md-table-row="{ item }">
                  <md-table-row>
                    <md-table-cell md-label="Field Name" md-sort-by="field">{{
                      item.field
                    }}</md-table-cell>
                    <md-table-cell md-label="Value">
                      <md-chip
                        class="u_margin-bottom-small"
                        v-for="(element, i) in item['values']"
                        :key="`C${i}`"
                        >{{ element }}</md-chip
                      >
                    </md-table-cell>
                    <md-table-cell md-label="User" md-sort-by="user">{{
                      item.user ?? ''
                    }}</md-table-cell>
                    <md-table-cell md-label="Actions">
                      <md-button
                        class="md-icon-button"
                        style="min-width: 1rem; margin: 0"
                        @click.prevent="editItem(item.field)"
                      >
                        <md-icon style="font-size: 2rem !important">edit</md-icon>
                      </md-button>
                      <md-button
                        class="md-icon-button"
                        style="min-width: 1rem; margin: 0"
                        @click.prevent="confirmDeleteDialog(item)"
                      >
                        <md-icon style="font-size: 2rem !important">delete</md-icon>
                      </md-button>
                    </md-table-cell>
                  </md-table-row>
                </template>
              </md-table>
              <pagination
                :cpage="pageNumber"
                :tpages="getXlsxCurationList.totalPages"
                @go-to-page="loadNextPage($event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <dialogbox :active="dialogBoxActive" :minWidth="40">
      <template v-slot:title>Delete entry?</template>
      <template v-slot:content>
        You are deleting <b>{{ dialog.field }}</b>
        <span v-if="dialog.values"> with values: </span>
        <div class="md-layout md-gutter md-alignment-bottom-center" style="margin-top: 1rem">
          <md-chip
            class="u_margin-bottom-small"
            v-for="(value, index) in dialog['values']"
            :key="`value_${index}`"
            >{{ value }}</md-chip
          >
        </div>
      </template>
      <template v-slot:actions>
        <md-button type="submit" class="md-button-transparent" @click="toggleDialogBox()">
          No, cancel
        </md-button>
        <md-button type="submit" class="md-button-transparent" @click="deleteItem()">
          Yes, delete
        </md-button>
      </template>
    </dialogbox>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { SEARCH_SPREADSHEETLIST_QUERY, DELETE_SPREADSHEETLIST } from '@/modules/gql/material-gql';
import Pagination from '@/components/explorer/Pagination.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import Dialog from '@/components/Dialog.vue';

// Component name for debugging
defineOptions({
  name: 'AllExcelFormEntries',
});

// Router and store
const router = useRouter();
const store = useStore();

// Reactive data
const loading = ref(false);
const pageNumber = ref(1);
const searchMode = ref(false);
const fieldName = ref('');
const searchValue = ref('');

interface DialogData {
  field: string | null;
  user: string | null;
  values: string[];
}

const dialog = ref<DialogData>({
  field: null,
  user: null,
  values: [],
});

// Computed
const dialogBoxActive = computed(() => store.getters['dialogBox']);

// GraphQL query
const { result, refetch } = useQuery(
  SEARCH_SPREADSHEETLIST_QUERY,
  () => ({
    input: {
      field: searchValue.value,
      pageNumber: pageNumber.value,
    },
  }),
  {
    fetchPolicy: 'cache-and-network',
  }
);

const getXlsxCurationList = computed(() => result.value?.getXlsxCurationList || {});

// GraphQL mutation
const { mutate: deleteSpreadsheetList } = useMutation(DELETE_SPREADSHEETLIST);

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const submitSearch = () => {
  if (!fieldName.value.trim()) return;
  searchValue.value = fieldName.value.trim().split(' ').join('_');
  searchMode.value = true;
};

const clearInput = () => {
  searchMode.value = false;
  fieldName.value = '';
  searchValue.value = '';
};

// Reroute to update page and pass field to Vuex
const editItem = (event: string) => {
  store.commit('explorer/curation/setFieldNameSelected', event.trim().split(' ').join('_'));
  router.push('/explorer/curate/validList/update');
};

const deleteItem = async () => {
  try {
    await deleteSpreadsheetList({
      input: { field: dialog.value.field },
    });

    // Remove from the list without needing to refresh apollo
    if (getXlsxCurationList.value.columns) {
      const array = getXlsxCurationList.value.columns;
      const index = array.indexOf(dialog.value);
      if (index > -1) {
        array.splice(index, 1);
      }
    }

    toggleDialogBox();
    store.commit('setSnackbar', {
      message: 'Deletion Successful',
      duration: 4000,
    });
  } catch (error: any) {
    if (error.message?.search(/not authenticated/i) !== -1) {
      return store.commit('setSnackbar', {
        message: error.message ?? 'Something went wrong',
        duration: 5000,
      });
    }
    store.commit('setSnackbar', {
      message: error,
      duration: 5000,
    });
  }
};

const confirmDeleteDialog = (event: DialogData) => {
  dialog.value = event;
  toggleDialogBox();
};

const loadNextPage = (event: number) => {
  pageNumber.value = event;
};

// Watch for errors
watch(
  () => result.value,
  (newResult) => {
    if (newResult?.error) {
      store.commit('setSnackbar', {
        message: newResult.error,
      });
    }
  }
);
</script>
