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
      <h1 class="visualize_header-h1 article_title u_centralize_text">All Current Valid Entries</h1>
      <div style="max-width: 99%;">
        <div class="md-layout md-gutter md-alignment-top-center">
          <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">
            <div v-if="!!getXlsxCurationList.columns" >
              <md-field style="align-items: baseline">
                <p style="margin-right: 4px;font-weight: bold;"><md-icon>search</md-icon></p>
                <label style="margin-left: 2.5rem">Search Entries</label>
                <md-input v-model="fieldName" @keyup.enter="submitSearch" id="fieldName"></md-input>
              </md-field>
              <div class="form__group explorer_page-nav u--margin-neg">
                <button type="submit"
                    class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click.prevent="submitSearch"
                > Search
                </button>
                <button v-if="searchMode"
                    class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click.prevent="clearInput"
                > Clear
                </button>
              </div>
              <md-table v-model="getXlsxCurationList.columns" md-sort="name" md-sort-order="asc" >
                <md-table-row slot="md-table-row" slot-scope="{ item }">
                  <md-table-cell md-label="Field Name" md-sort-by="field">{{ item.field }}</md-table-cell>
                  <md-table-cell md-label="Value">
                    <md-chip v-for="(element, i) in item['values']" :key="`C${i}`">{{ element }}</md-chip>
                  </md-table-cell>
                  <md-table-cell md-label="User" md-sort-by="user">{{ item.user ?? ''}}</md-table-cell>
                  <md-table-cell md-label="Actions">
                        <md-button class="md-icon-button" style="min-width:1rem; margin:0"
                          @click.prevent="editItem(item.field)">
                          <md-icon style="font-size:2rem!important;">edit</md-icon>
                        </md-button>
                        <md-button class="md-icon-button" style="min-width:1rem; margin:0"
                          @click.prevent="confirmDeleteDialog(item)">
                          <md-icon style="font-size:2rem!important;">delete</md-icon>
                        </md-button>
                  </md-table-cell>
                </md-table-row>
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
        <span v-if="dialog.values">
            with values:
        </span>
        <div class="md-layout md-gutter md-alignment-bottom-center" style="margin-top:1rem">
            <md-chip v-for="(value, index) in dialog['values']" :key="`value_${index}`">{{ value }}</md-chip>
        </div>
      </template>
      <template v-slot:actions>
        <md-button type="submit" class="md-button-transparent"
            @click="toggleDialogBox()"> No, cancel
        </md-button>
        <md-button type="submit" class="md-button-transparent"
            @click="deleteItem()">
            Yes, delete
        </md-button>
      </template>
    </dialogbox>
</div>
</template>

<script>
import { SEARCH_SPREADSHEETLIST_QUERY, DELETE_SPREADSHEETLIST } from '@/modules/gql/material-gql.js'
import pagination from '@/components/explorer/Pagination'
import { mapMutations, mapGetters } from 'vuex'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Dialog from '@/components/Dialog.vue'

export default {
  name: 'AllExcelFormEntries',
  data () {
    return {
      loading: false,
      pageNumber: 1,
      searchMode: false,
      getXlsxCurationList: {},
      fieldName: '',
      searchValue: '',
      dialog: {
        field: null,
        user: null,
        values: []
      }
    }
  },
  components: {
    pagination,
    CurateNavBar,
    dialogbox: Dialog
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  },
  methods: {
    ...mapMutations('explorer/curation', ['setFieldNameSelected']),
    ...mapMutations({ toggleDialogBox: 'setDialogBox' }),
    submitSearch () {
      if (!this.fieldName.trim()) return
      this.searchValue = this.fieldName.trim().split(' ').join('_')
      this.searchMode = true
    },
    clearInput () {
      this.searchMode = false
      this.fieldName = ''
      this.searchValue = ''
    },
    // Reroute to update page and pass field to Vuex
    editItem (event) {
      this.setFieldNameSelected(event.trim().split(' ').join('_'))
      this.$router.push('/explorer/curate/validList/update')
    },
    async deleteItem () {
      try {
        await this.$apollo.mutate({
          mutation: DELETE_SPREADSHEETLIST,
          variables: {
            input: { field: this.dialog.field }
          }
        })
        // Remove from the list without needing to refresh apollo
        const array = this.getXlsxCurationList.columns
        const index = array.indexOf(this.dialog)
        if (index > -1) { array.splice(index, 1) }

        this.toggleDialogBox()
        this.$store.commit('setSnackbar', {
          message: 'Deletion Successful',
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
          message: error,
          duration: 5000
        })
      }
    },
    confirmDeleteDialog (event) {
      this.dialog = event
      this.toggleDialogBox()
    },
    loadNextPage (event) {
      this.pageNumber = event
    }
  },
  apollo: {
    getXlsxCurationList: {
      query: SEARCH_SPREADSHEETLIST_QUERY,
      variables () {
        return {
          input: {
            field: this.searchValue,
            pageNumber: this.pageNumber
          }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
        this.$store.commit('setSnackbar', {
          message: error
        })
      }
    }
  }
}
</script>
