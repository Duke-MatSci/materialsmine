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
        Spreadsheet List Form
      </h1>

      <div style="max-width: 99%">
        <div class="md-layout md-gutter md-alignment-top-center">
          <div
            class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
          >
            <md-table v-if="!!fieldName || !!tableData.length">
              <md-table-row>
                <md-table-head>FieldName</md-table-head>
                <md-table-head>Value</md-table-head>
              </md-table-row>

              <md-table-row v-for="item in tableData" :key="item.field">
                <md-table-cell>{{ item.field }}</md-table-cell>
                <md-table-cell>
                  <md-chip
                    class="u_margin-bottom-small"
                    v-for="(element, i) in item['values']"
                    @md-delete="deleteValue(item['values'], i)"
                    md-deletable
                    :key="`B${i}`"
                    >{{ element }}</md-chip
                  >
                </md-table-cell>
              </md-table-row>

              <md-table-row>
                <md-table-cell>{{ fieldName.split(' ').join('_') }}</md-table-cell>
                <md-table-cell>
                  <md-chip
                    v-for="(item, i) in value"
                    @md-delete="deleteValue(value, i)"
                    md-deletable
                    :key="`C${i}`"
                    class="u--color-primary u_margin-bottom-small"
                    >{{ item }}</md-chip
                  >
                </md-table-cell>
              </md-table-row>
            </md-table>

            <md-table v-if="!!uploadedData.length && isSubmitted" v-model="uploadedData">
              <md-table-toolbar
                ><h1 class="md-title u--color-success">Successful Uploads</h1></md-table-toolbar
              >

              <template #md-table-row="{ item }">
                <md-table-row>
                  <md-table-cell md-label=""
                    ><md-icon class="u--color-success">check</md-icon></md-table-cell
                  >
                  <md-table-cell md-label="FieldName">{{ item.field }}</md-table-cell>
                  <md-table-cell md-label="Value">
                    <md-chip
                      class="u_margin-bottom-small"
                      v-for="(element, i) in item['values']"
                      :key="`C${i}`"
                      >{{ element }}</md-chip
                    >
                  </md-table-cell>
                </md-table-row>
              </template>
            </md-table>

            <md-table v-if="!!rejectedData.length && isSubmitted" v-model="rejectedData">
              <md-table-toolbar>
                <h1 class="md-title u--color-error">Failed: Already exists.</h1>
                <span><a href="/explorer/curate/validlist/update">Update here</a></span>
              </md-table-toolbar>

              <template #md-table-row="{ item }">
                <md-table-row>
                  <md-table-cell md-label=""
                    ><md-icon class="u--color-error">close</md-icon></md-table-cell
                  >
                  <md-table-cell md-label="FieldName">{{ item.field }}</md-table-cell>
                  <md-table-cell md-label="Value">
                    <md-chip
                      class="u_margin-bottom-small"
                      v-for="(element, i) in item['values']"
                      :key="`D${i}`"
                      >{{ element }}</md-chip
                    >
                  </md-table-cell>
                </md-table-row>
              </template>
            </md-table>

            <div v-if="!uploadedData.length || !rejectedData.length">
              <md-field style="align-items: baseline">
                <p style="margin-right: 4px; font-weight: bold">FieldName:</p>
                <md-input v-model="fieldName" id="fieldName"></md-input>
              </md-field>

              <md-field style="align-items: baseline">
                <p style="margin-right: 4px; font-weight: bold">Value:</p>
                <md-input
                  v-model="currValue"
                  @keyup.enter="insertValue"
                  :disabled="!fieldName"
                  id="fieldValue"
                ></md-input>
                <md-button class="md-icon-button md-dense" @click="insertValue">
                  <md-icon>add</md-icon>
                </md-button>
              </md-field>

              <div
                class="form__group search_box_form-item-2 explorer_page-nav u_margin-top-med"
              >
                <button
                  type="submit"
                  class="btn btn--tertiary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="addMore"
                >
                  Add more
                </button>

                <button
                  type="submit"
                  v-if="!isSubmitted"
                  class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="submit"
                >
                  Submit
                </button>

                <button
                  v-if="isSubmitted"
                  class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                  @click.prevent="clearInput"
                >
                  Clear
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
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useMutation } from '@vue/apollo-composable';
import { CREATEMATERIAL_QUERY } from '@/modules/gql/material-gql';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';

// Component name for debugging
defineOptions({
  name: 'ExcelSheetForm',
});

// Store
const store = useStore();

// Interfaces
interface TableDataItem {
  field: string;
  values: string[];
}

// Reactive data
const index = ref(0);
const tableData = ref<TableDataItem[]>([]);
const uploadedData = ref<TableDataItem[]>([]);
const rejectedData = ref<TableDataItem[]>([]);
const fieldName = ref('');
const currValue = ref('');
const value = ref<string[]>([]);
const isSubmitted = ref(false);

// GraphQL mutation
const { mutate: createMaterial } = useMutation(CREATEMATERIAL_QUERY);

// Methods
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

const deleteValue = (arr: string[], e: number) => {
  arr.splice(e, 1);
  if (!arr.length) {
    sanitizeArr();
  }
};

const sanitizeArr = () => {
  tableData.value.forEach((val, index, arr) => {
    if (!val.values.length) arr.splice(index, 1);
  });
};

const addMore = () => {
  if (!!fieldName.value && !!value.value.length) {
    const obj: TableDataItem = {
      field: fieldName.value.trim().split(' ').join('_'),
      values: value.value,
    };
    tableData.value.push(obj);
    fieldName.value = '';
    currValue.value = '';
    value.value = [];
  }
};

const submit = async () => {
  sanitizeArr();
  addMore();
  if (!tableData.value.length) return;
  isSubmitted.value = !isSubmitted.value;
  try {
    const response = await createMaterial({
      input: {
        columns: tableData.value,
      },
    });
    if (response?.data?.createXlsxCurationList?.columns?.length) {
      uploadedData.value = [...response.data.createXlsxCurationList.columns];
      tableData.value = [];
    }
    return store.commit('setSnackbar', {
      message: 'Successful entry',
      duration: 4000,
    });
  } catch (error: any) {
    const objReg = /\{[^}]*\}/gi;
    if (objReg.test(error.message)) {
      return handleDuplicateError(error.message.match(objReg));
    } else if (error.message?.search(/not authenticated/i) !== -1) {
      return store.commit('setSnackbar', {
        message: error.message ?? 'Something went wrong',
        duration: 5000,
      });
    }
    if (!objReg.test(error.message)) {
      return store.commit('setSnackbar', {
        message: 'Something went wrong',
        action: () => submit(),
      });
    }
  }
};

const clearInput = () => {
  isSubmitted.value = !isSubmitted.value;
  // Resetting to default values if cleared
  uploadedData.value = [];
  rejectedData.value = [];
};

const handleDuplicateError = (arg: RegExpMatchArray | null) => {
  if (!arg) return;
  const strReg = /"[^"]*"/i;
  const data = arg.map((val) => {
    const match = val.match(strReg);
    return match ? JSON.parse(match[0]) : null;
  }).filter(Boolean);
  
  tableData.value.forEach((val, index, arr) => {
    if (data.includes(val.field)) {
      rejectedData.value.push(arr[index]);
    } else {
      uploadedData.value.push(arr[index]);
    }
  });
  tableData.value = [];
};
</script>
