<template>
  <div class="spreadsheet_list_form section_teams">
      <div >
          <div style="max-width: 99%;">
              <div class="md-layout md-alignment-top-center">
                  <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">
                    <CurateNavBar active=""/>
                  </div>
              </div>
          </div>
          <h1 class="visualize_header-h1 article_title u_centralize_text">Update Valid List</h1>
          <div style="max-width: 99%;">
              <div class="md-layout md-gutter md-alignment-top-center">
                  <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">

                    <div>
                      <md-table v-if="!!spreadsheetList.length && !editMode" v-model="spreadsheetList" @md-selected="onSelect">
                        <md-table-toolbar><h1 class="md-title">Search Results</h1></md-table-toolbar>
                        <md-table-row slot="md-table-row" slot-scope="{ item}" md-selectable="single">
                          <md-table-cell md-label="Field Name">{{ item.field }}</md-table-cell>
                          <md-table-cell md-label="Value">
                            <md-chip v-for="(element, i) in item['values']" :key="`C${i}`">{{ element }}</md-chip>
                          </md-table-cell>
                          <md-table-cell md-label="User">{{ item.user ?? ''}}</md-table-cell>
                        </md-table-row>
                      </md-table>

                      <md-table v-if="editMode & !Object.keys(uploadedData).length" >

                        <md-table-row>
                          <md-table-head>Field Name</md-table-head>
                          <md-table-head>Value</md-table-head>
                        </md-table-row>

                        <md-table-row>
                          <md-table-cell>{{ fieldName }}</md-table-cell>
                          <md-table-cell>
                            <md-chip v-for="(element, i) in value" @md-delete="deleteValue(value, i)" md-deletable :key="`${i}`">{{ element }}</md-chip>
                          </md-table-cell>
                        </md-table-row>

                      </md-table>

                      <md-table v-if="!!Object.keys(uploadedData).length">
                        <md-table-toolbar ><h1 class="md-title u--color-success">Update Successful</h1></md-table-toolbar>

                        <md-table-row>
                          <md-table-head>Field Name</md-table-head>
                          <md-table-head>Value</md-table-head>
                          <md-table-head>User</md-table-head>
                        </md-table-row>

                        <md-table-row>
                          <md-table-cell>{{ uploadedData.field }}</md-table-cell>
                          <md-table-cell>
                            <md-chip v-for="(element, i) in uploadedData['values']" :key="`${i}`">{{ element }}</md-chip>
                          </md-table-cell>
                          <md-table-cell>{{ uploadedData.user ?? '' }}</md-table-cell>
                        </md-table-row>

                      </md-table>
                    </div>

                    <div>
                      <md-field style="align-items: baseline;">
                        <p style="margin-right: 4px;font-weight: bold;">Field Name:</p>
                        <md-input v-model="fieldName" @keyup.enter="submitSearch" id="fieldName"></md-input>
                      </md-field>

                      <md-field style="align-items: baseline;">
                        <p style="margin-right: 4px;font-weight: bold;">Value:</p>
                        <md-input v-model="currValue" @keyup.enter="insertValue" :disabled="!editMode && !Object.keys(uploadedData).length" id="fieldValue"></md-input>
                        <md-button class="md-icon-button md-dense" @click="insertValue">
                          <md-icon>add</md-icon>
                        </md-button>
                      </md-field>

                      <div class="form__group search_box_form-item-2 explorer_page-nav u_margin-top-med">
                        <button type="submit"
                          class="btn btn--tertiary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                          @click.prevent="submitSearch">  Search </button>

                        <button type="submit"
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

<script>
import { SEARCH_SPREADSHEETLIST_QUERY, UPDATE_SPREADSHEETLIST } from '@/modules/gql/material-gql.js'
import { mapGetters } from 'vuex'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
export default {
  name: 'SpreadsheetUpdate',
  data () {
    return {
      loading: false,
      pageNumber: 1,
      searchMode: true,
      editMode: false,
      spreadsheetList: [],
      uploadedData: {},
      fieldName: '',
      currValue: '',
      value: []
    }
  },
  components: {
    CurateNavBar
  },
  computed: {
    searchValue () {
      return this.fieldName.trim().split(' ').join('_')
    },
    ...mapGetters({ fieldNameSelected: 'explorer/curation/getFieldNameSelected' })
  },
  methods: {
    resetState () {
      this.spreadsheetList = []
      this.uploadedData = {}
      this.value = []
      this.currValue = ''
    },
    onSelect (item) {
      if (item) {
        this.fieldName = item.field
        this.value = item.values
        this.editMode = true
      }
    },
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
    },
    async submitSearch () {
      if (!this.fieldName.trim()) return
      const searchValue = this.searchValue
      this.searchMode = false

      try {
        const response = await this.$apollo.query({
          query: SEARCH_SPREADSHEETLIST_QUERY,
          variables: {
            input: {
              field: searchValue,
              pageNumber: this.pageNumber,
              pageSize: 20
            }
          },
          fetchPolicy: 'no-cache'
        })
        if (!response) {
          const error = new Error('Something went wrong!')
          throw error
        }
        const result = response?.data?.getXlsxCurationList
        this.resetState()
        this.editMode = false
        this.spreadsheetList = result.columns || []
        this.value = []
        this.pageNumber = result.pageNumber || 1
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.submitSearch()
        })
        this.searchMode = true
      }
    },

    async update () {
      if (!!this.fieldName && !this.value.length) {
        return this.$store.commit('setSnackbar', {
          message: 'Field Value Required',
          duration: 2500
        })
      }

      try {
        const response = await this.$apollo.mutate({
          mutation: UPDATE_SPREADSHEETLIST,
          variables: {
            input: { field: this.searchValue, values: this.value }
          }
        })
        this.uploadedData = { ...response.data.updateXlsxCurationList }
        this.$store.commit('setSnackbar', {
          message: 'Update Successful',
          duration: 4000
        })
      } catch (error) {
        if (error.message.search(/not authenticated/i) !== -1) {
          return this.$store.commit('setSnackbar', {
            message: error.message ?? 'Something went wrong',
            duration: 5000
          })
        }
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.update()
        })
      }
    }

  },
  async created () {
    // Check store. Indicates update came from 'all' list
    if (this.fieldNameSelected) {
      this.editMode = true
      this.fieldName = this.fieldNameSelected
      await this.submitSearch()
      if (this.spreadsheetList.length) {
        this.onSelect(this.spreadsheetList[0])
      }
    }
  }
}
</script>
