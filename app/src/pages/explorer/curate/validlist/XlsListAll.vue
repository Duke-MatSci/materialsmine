<template>
<div class="spreadsheet_list_form section_teams">
    <div>
      <h1 class="visualize_header-h1 article_title u_centralize_text">All Current Validation Entries</h1>
      <div style="max-width: 99%;">
        <div class="md-layout md-gutter md-alignment-top-center">
          <div class="md-layout-item md-size-50 md-medium-size-70 md-small-size-85 md-xsmall-size-95">
            <div v-if="!!getXlsxCurationList?.columns.length" >
              <md-table v-model="getXlsxCurationList.columns">
                <md-table-row slot="md-table-row" slot-scope="{ item}">
                  <md-table-cell md-label="Field Name">{{ item.field }}</md-table-cell>
                  <md-table-cell md-label="Value">
                    <md-chip v-for="(element, i) in item['values']" :key="`C${i}`">{{ element }}</md-chip>
                  </md-table-cell>
                  <md-table-cell md-label="User">{{ item.user ?? ''}}</md-table-cell>
                  <!--TODO: Should we allow admins to edit/delete from here?-->
                  <!-- <md-table-cell md-label="Actions"><a>edit</a> <a>delete</a></md-table-cell> -->
                </md-table-row>
              </md-table>
              <pagination
                :cpage="pageNumber"
                :tpages="getXlsxCurationList.totalPages"
                @go-to-page="loadPrevNextImage($event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
</template>

<script>
import { SEARCH_SPREADSHEETLIST_QUERY } from '@/modules/gql/material-gql.js'
import pagination from '@/components/explorer/Pagination'

export default {
  name: 'AllExcelFormEntries',
  data () {
    return {
      loading: false,
      pageNumber: 1,
      searchMode: true,
      getXlsxCurationList: {},
      fieldName: '',
    }
  },
  components: {
    pagination
  },
  computed: {
    searchValue () {
      return this.fieldName.trim().split(' ').join('_')
    }
  },
  methods: {
    async submitSearch () {
      //TODO: Allow users to search list
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
          message: error,
        })
      }
    },
  }
}
</script>
