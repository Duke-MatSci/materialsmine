<template>
  <div class="spreadsheet_list_form section_teams">
      <div>
          <div style="max-width: 99%;">
              <div class="md-layout md-alignment-top-center">
                  <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">
                  <CurateNavBar active=""/>
                  </div>
              </div>
          </div>
          <h1 class="visualize_header-h1 article_title u_centralize_text">Spreadsheet List Form</h1>

          <div style="max-width: 99%;">
              <div class="md-layout md-gutter md-alignment-top-center">
                  <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">

                    <md-table v-if="!!fieldName || !!tableData.length" >
                      <md-table-row>
                        <md-table-head>FieldName</md-table-head>
                        <md-table-head>Value</md-table-head>
                      </md-table-row>

                      <md-table-row v-for="item in tableData" :key="item.field">
                        <md-table-cell>{{ item.field }}</md-table-cell>
                        <md-table-cell>
                          <md-chip class="u_margin-bottom-small" v-for="(element, i) in item['values']" @md-delete="deleteValue(item['values'], i)" md-deletable :key="`B${i}`">{{ element }}</md-chip>
                        </md-table-cell>
                      </md-table-row>

                      <md-table-row>
                        <md-table-cell>{{ fieldName.split(" ").join("_")}}</md-table-cell>
                        <md-table-cell>
                          <md-chip v-for="(item, i) in value" @md-delete="deleteValue(value, i)" md-deletable :key="`C${i}`" class="u--color-primary u_margin-bottom-small">{{ item }}</md-chip>
                        </md-table-cell>
                      </md-table-row>
                    </md-table>

                    <md-table v-if="!!uploadedData.length && isSubmitted" v-model="uploadedData" >
                      <md-table-toolbar><h1 class="md-title u--color-success">Successful Uploads</h1></md-table-toolbar>

                      <md-table-row slot="md-table-row" slot-scope="{ item }" >
                        <md-table-cell md-label=""><md-icon class="u--color-success">check</md-icon></md-table-cell>
                        <md-table-cell md-label="FieldName">{{ item.field }}</md-table-cell>
                        <md-table-cell md-label="Value">
                          <md-chip class="u_margin-bottom-small" v-for="(element, i) in item['values']" :key="`C${i}`">{{ element }}</md-chip>
                        </md-table-cell>
                      </md-table-row>
                    </md-table>

                    <md-table v-if="!!rejectedData.length && isSubmitted" v-model="rejectedData" >
                      <md-table-toolbar>
                        <h1 class="md-title u--color-error">Failed: Already exists.</h1>
                        <span><a href="/explorer/curate/validlist/update">Update here</a></span>
                      </md-table-toolbar>

                      <md-table-row slot="md-table-row" slot-scope="{ item }" >
                        <md-table-cell md-label=""><md-icon class="u--color-error">close</md-icon></md-table-cell>
                        <md-table-cell md-label="FieldName">{{ item.field }}</md-table-cell>
                        <md-table-cell md-label="Value">
                          <md-chip class="u_margin-bottom-small" v-for="(element, i) in item['values']" :key="`D${i}`">{{ element }}</md-chip>
                        </md-table-cell>
                      </md-table-row>
                    </md-table>

                    <div v-if="!uploadedData.length || !rejectedData.length">

                      <md-field style="align-items: baseline;">
                        <p style="margin-right: 4px;font-weight: bold;">FieldName:</p>
                        <md-input v-model="fieldName" id="fieldName"></md-input>
                        <span class="md-helper-text">Section::Subsection::Unit</span>
                      </md-field>

                      <md-field style="align-items: baseline;">
                        <p style="margin-right: 4px;font-weight: bold;">Value:</p>
                        <md-input v-model="currValue" @keyup.enter="insertValue" :disabled="!fieldName" id="fieldValue"></md-input>
                        <md-button class="md-icon-button md-dense" @click="insertValue">
                          <md-icon>add</md-icon>
                        </md-button>
                      </md-field>

                      <div class="form__group search_box_form-item-2 explorer_page-nav u_margin-top-med">
                        <button type="submit"
                          class="btn btn--tertiary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                          @click.prevent="addMore"
                        >  Add more </button>

                        <button type="submit" v-if="!isSubmitted"
                          class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                          @click.prevent="submit"
                        >
                        Submit
                        </button>

                        <button v-if="isSubmitted"
                          class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                          @click.prevent="clearInput"
                        > Clear
                        </button>
                      </div>
                    </div>

                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script>
import { CREATEMATERIAL_QUERY } from '@/modules/gql/material-gql.js'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
export default {
  name: 'ExcelSheetForm',
  data () {
    return {
      index: 0,
      tableData: [],
      uploadedData: [],
      rejectedData: [],
      fieldName: '',
      currValue: '',
      value: [],
      isSubmitted: false
    }
  },
  components: {
    CurateNavBar
  },
  methods: {
  // Write method to check duplicate field entry
    insertValue () {
      if (!this.currValue.trim().length) return
      if (!this.value.includes(this.currValue.trim())) {
        this.value.push(this.currValue)
        this.currValue = ''
        return
      }
      this.$store.commit('setSnackbar', {
        message: 'Duplicate Value Entered',
        duration: 3000
      })
    },
    deleteValue (arr, e) {
      arr.splice(e, 1)
      if (!arr.length) {
        this.sanitizeArr()
      }
    },
    sanitizeArr () {
      this.tableData.forEach((val, index, arr) => {
        if (!val.values.length) arr.splice(index, 1)
      })
    },
    addMore () {
      if (!!this.fieldName && !!this.value.length) {
        const obj = { field: this.fieldName.trim().split(' ').join('_'), values: this.value }
        this.tableData.push(obj)
        this.fieldName = ''
        this.currValue = ''
        this.value = []
      }
    },
    async submit () {
      this.sanitizeArr()
      this.addMore()
      if (!this.tableData.length) return
      this.isSubmitted = !this.isSubmitted
      try {
        const response = await this.$apollo.mutate({
          mutation: CREATEMATERIAL_QUERY,
          variables: {
            input: {
              columns: this.tableData
            }
          }
        })
        if (response.data.createXlsxCurationList.columns.length) {
          this.uploadedData = [...response.data.createXlsxCurationList.columns]
          this.tableData = []
        }
        return this.$store.commit('setSnackbar', {
          message: 'Successful entry',
          duration: 4000
        })
      } catch (error) {
        const objReg = /\{[^}]*\}/gi
        if (objReg.test(error.message)) {
          return this.handleDuplicateError(error.message.match(objReg))
        } else if (error.message.search(/not authenticated/i) !== -1) {
          return this.$store.commit('setSnackbar', {
            message: error.message ?? 'Something went wrong',
            duration: 5000
          })
        }
        if (!objReg.test(error.message)) {
          return this.$store.commit('setSnackbar', {
            message: 'Something went wrong',
            action: () => this.submit()
          })
        }
      }
    },
    clearInput () {
      this.isSubmitted = !this.isSubmitted
      // Resetting to default values if cleared
      this.uploadedData = []
      this.rejectedData = []
    },
    handleDuplicateError (arg) {
      const strReg = /"[^"]*"/i
      const data = arg.map((val) => JSON.parse(val.match(strReg)[0]))
      this.tableData.forEach((val, index, arr) => {
        if (data.includes(val.field)) {
          this.rejectedData.push(arr[index])
        } else {
          this.uploadedData.push(arr[index])
        }
      })
      this.tableData = []
    }
  }
}
</script>
