<template>
  <div>
    <dialogBox :active="dialogBoxActive" :minWidth="60">
      <template v-slot:title>Delete Users</template>
      <template v-slot:content>
        <div> Are you sure you want to delete the following user(s)</div>
      </template>
      <template v-slot:actions>
        <button class="md-button btn btn--primary btn--noradius" @click="closeDialogBox">
          CANCEL
        </button>
        <button class="md-button btn btn--tertiary btn--noradius" @click.prevent="deleteUsers">
          DELETE
        </button>
      </template>
    </dialogBox>
    <div class="">
      <div class="">
        <div class="">
          <div>
            <div class="" v-if="loading">
              <Spinner :loading="loading" :text="'Loading'" />
            </div>
            <md-table v-if="!!Object.keys(users).length && !loading" v-model="tableData" md-sort="name"
              md-sort-order="asc" @md-selected="onSelect">
              <md-table-toolbar>
                <div class="md-toolbar-section-start">
                  <h1 class="md-title">Manage Users</h1>
                </div>

                <md-field md-clearable class="md-toolbar-section-end">
                  <md-input placeholder="Search by display name..." v-model="search" @input="searchOnTable" />
                </md-field>

                <div style="order:100;align-items: center;" v-if="!!this.selected?.length"
                  class="viz-sample__header u_width--max u--layout-flex u--layout-flex-justify-sb">
                  <div class="u--color-alt md-body-1">{{ getAlternateLabel(this.selected.length) }}</div>
                  <div class="u--layout-flex">
                    <md-button v-if="this.selected.length === 1" class="md-icon-button">
                      <md-icon>edit</md-icon>
                      <md-tooltip md-direction="top">Update User</md-tooltip>
                    </md-button>
                    <md-button @click.prevent="openDialogBox" class="md-icon-button">
                      <md-icon>delete</md-icon>
                      <md-tooltip md-direction="top">Delete User</md-tooltip>
                    </md-button>
                  </div>
                </div>
              </md-table-toolbar>
              <md-table-empty-state md-label="No users found"
                :md-description="`No user found for this '${search}' query. Try a different search term or create a new user.`">
              </md-table-empty-state>
              <md-table-row slot="md-table-row" slot-scope="{ item }" :class="getClass(item)" md-selectable="multiple">
                <md-table-cell md-label="Firstname" md-sort-by="givenName">{{ item.givenName }}</md-table-cell>
                <md-table-cell md-label="Lastname" md-sort-by="surName">{{ item.surName }}</md-table-cell>
                <md-table-cell md-label="Display name" md-sort-by="displayName">{{ item.displayName }}</md-table-cell>
                <md-table-cell md-label="Email" md-sort-by="email">{{ item.email }}</md-table-cell>
              </md-table-row>
            </md-table>
            <pagination :cpage="pageNumber || 1" :tpages="users.totalPages || 1"
              @go-to-page="loadPrevNextUsers($event)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import { USERS_QUERY, DELETE_USERS_QUERY } from '@/modules/gql/user-gql'
import pagination from '@/components/explorer/Pagination'
import dialogBox from '@/components/Dialog.vue'
import Spinner from '@/components/Spinner'
export default {
  name: 'ManageUser',
  components: {
    pagination,
    dialogBox,
    Spinner
  },
  data() {
    return {
      loading: false,
      pageNumber: 1,
      selected: null,
      search: null,
      searched: [],
      users: {}
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    }),
    tableData: {
      get() {
        return this.search ? this.searched : this.users.data
      },
      set(val) {
        return val
      }
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    openDialogBox() {
      this.toggleDialogBox()
    },
    closeDialogBox() {
      this.toggleDialogBox()
    },
    getClass({ _id }) {
      return _id === this.selected?._id ? 'u--bg' : ''
    },
    getAlternateLabel(count) {
      let plural = ''
      if (count > 1) {
        plural = 's'
      }
      return `${count} user${plural} selected`
    },
    async searchOnTable() {
      this.pageNumber = 1
      await this.$apollo.queries.users.refetch()
      this.searched = this.users.data
    },
    onSelect(items) {
      this.selected = items
    },
    async loadPrevNextUsers(event) {
      this.pageNumber = event
      await this.$apollo.queries.users.refetch()
    },
    async deleteUsers() {
      const id = []
      for (let i = 0; i < this.selected.length; i++) {
        id.push(this.selected[i]._id)
      }
      this.loading = true
      try {
        await this.$apollo.mutate({
          mutation: DELETE_USERS_QUERY,
          variables: {
            input: {
              ids: id
            }
          }
        })
        this.$store.commit('setSnackbar', {
          message: 'Users deleted successfully',
          duration: 3000
        })
        await this.$apollo.queries.users.refetch()
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.deleteUsers()
        })
      } finally {
        this.loading = false
      }
    }
  },
  created() {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: '' })
  },
  apollo: {
    users: {
      query: USERS_QUERY,
      variables() {
        return {
          input: { pageNumber: this.pageNumber, pageSize: 10, displayName: this.search }
        }
      },
      fetchPolicy: 'cache-and-network',
      error(error) {
        if (error.networkError) {
          const err = error.networkError
          this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`
        } else if (error.graphQLErrors) {
          this.error = error.graphQLErrors
        }
        this.$store.commit('setSnackbar', {
          message: error.networkError?.response?.statusText ?? error.graphQLErrors,
          action: () => this.$apollo.queries.users.refetch()
        })
      }
    }
  }
}
</script>