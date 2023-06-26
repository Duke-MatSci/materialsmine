<template>
  <div>
    <dialogBox :active="dialogBoxActive" :minWidth="60">
      <template v-slot:title>Delete Users</template>
      <template v-slot:content>
        <div> Are you sure you want to delete the following user(s)</div>
      </template>
      <template v-slot:actions>
        <button class="md-button btn btn--primary btn--noradius" @click="closeDialogBox">CANCEL</button>
        <button class="md-button btn btn--tertiary btn--noradius" @click.prevent="deleteUsers">DELETE</button>
      </template>
    </dialogBox>
    <div class="">
      <div class="">
        <div class="" v-if="loading">
          <Spinner :loading="loading" :text="loadingText" />
        </div>

        <div v-if="updateMode" class="article_citations ">
          <h2 class="md-title u--color-black">Update User</h2>
          <form v-on:submit.prevent="updateUser" class="md-card-header">
            <div class="md-layout md-gutter viz-u-mgbottom-big">
              <div class="md-layout-item md-size-50 md-xsmall-size-100 md-gutter u_margin-top-small">
                <md-field>
                  <label for="first-name">Firstname</label>
                  <md-input v-model="selectedUser.givenName" name="first-name" required />
                </md-field>
              </div>

              <div class="md-layout-item md-size-50 md-xsmall-size-100 md-gutter u_margin-top-small">
                <md-field>
                  <label for="last-name">Lastname</label>
                  <md-input v-model="selectedUser.surName" name="last-name" required />
                </md-field>
              </div>

            </div>

            <div class="contactus_radios-text u_margin-top-med">Roles:</div>
            <ul class="contactus_radios">
              <li>
                <div class="form__radio-group">
                  <input type="radio" class="form__radio-input" v-model="selectedUser.roles" id="admin" value="isAdmin" required />
                  <label for="admin" class="form__radio-label">
                    <span class="form__radio-button"></span>
                    Admin
                  </label>
                </div>
              </li>
              <li>
                <div class="form__radio-group">
                  <input
                    type="radio" class="form__radio-input" v-model="selectedUser.roles" id="member" value="member" />
                  <label for="member" class="form__radio-label">
                    <span class="form__radio-button"></span>
                    Member
                  </label>
                </div>
              </li>
            </ul>

            <div class="md-card-actions md-alignment-right">
              <button class="md-button btn btn--tertiary btn--noradius" @click.prevent="closeUpdateForm">
                <span class="md-caption">CANCEL</span>
              </button>
              <button class="md-button btn btn--primary btn--noradius">
                <span class="md-caption u--bg">Submit</span>
              </button>
            </div>
          </form>
        </div>

        <div v-else>
          <md-table v-if="!!Object.keys(users).length && !loading" v-model="tableData" md-sort="name"
            md-sort-order="asc" @md-selected="onSelect">
            <md-table-toolbar>
              <div class="md-toolbar-section-start">
                <h1 class="md-title">Manage Users</h1>
              </div>

              <md-field md-clearable class="md-toolbar-section-end">
                <md-input placeholder="Search by display name..." v-model="search" @input="searchOnTable" />
              </md-field>

              <div style="order:100;align-items: center;" v-if="!!optionalChaining(() => selected.length)"
                class="viz-sample__header u_width--max u--layout-flex u--layout-flex-justify-sb">
                <div class="u--color-alt md-body-1">{{ getAlternateLabel(selected.length) }}</div>
                <div class="u--layout-flex">
                  <md-button @click="showUpdateForm" v-if="selected.length === 1" class="md-icon-button">
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
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import { USERS_QUERY, DELETE_USERS_QUERY, UPDATE_USER_QUERY } from '@/modules/gql/user-gql'
import optionalChainingUtil from '@/mixins/optional-chaining-util.js'
import pagination from '@/components/explorer/Pagination'
import dialogBox from '@/components/Dialog.vue'
import Spinner from '@/components/Spinner'
export default {
  name: 'ManageUser',
  mixins: [optionalChainingUtil],
  components: {
    pagination,
    dialogBox,
    Spinner
  },
  data () {
    return {
      loading: false,
      loadingText: 'Loading',
      pageNumber: 1,
      selected: [],
      selectedUser: {},
      updateMode: false,
      search: null,
      searched: [],
      users: {}
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      userId: 'auth/userId'
    }),
    tableData: {
      get () {
        return this.search ? this.searched : this.users.data
      },
      set (val) {
        return val
      }
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    openDialogBox () {
      this.toggleDialogBox()
    },
    closeDialogBox () {
      this.toggleDialogBox()
    },
    showUpdateForm () {
      this.updateMode = true
      this.selectedUser = { ...this.selected[0] }
    },
    closeUpdateForm () {
      this.updateMode = false
      this.selectedUser = {}
      this.selected = []
    },
    getClass ({ _id }) {
      return _id === this.selected?._id ? 'u--bg' : ''
    },
    getAlternateLabel (count) {
      let plural = ''
      if (count > 1) {
        plural = 's'
      }
      return `${count} user${plural} selected`
    },
    async searchOnTable () {
      this.pageNumber = 1
      await this.$apollo.queries.users.refetch()
      this.searched = this.users.data
    },
    onSelect (items) {
      this.selected = items
    },
    async loadPrevNextUsers (event) {
      this.pageNumber = event
      await this.$apollo.queries.users.refetch()
    },

    async deleteUsers () {
      const id = []
      for (let i = 0; i < this.selected.length; i++) {
        id.push(this.selected[i]._id)
      }
      if (id.includes(this.userId)) {
        return this.$store.commit('setSnackbar', {
          message: "Can't Delete Current User",
          duration: 3000
        })
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
          message: error?.message || 'Something went wrong',
          action: () => this.deleteUsers()
        })
      } finally {
        this.loading = false
      }
    },

    async updateUser () {
      const data = this.selectedUser
      if (!Object.keys(data).length) return

      if (this.userId === data._id && data.roles === 'member') {
        return this.$store.commit('setSnackbar', {
          message: 'Unable To Modify Current Role',
          duration: 3000
        })
      }

      this.loading = true
      this.loadingText = 'Updating User'

      try {
        await this.$apollo.mutate({
          mutation: UPDATE_USER_QUERY,
          variables: {
            input: {
              _id: data._id,
              givenName: data.givenName,
              surName: data.surName,
              roles: data.roles
            }
          }
        })
        this.$store.commit('setSnackbar', {
          message: 'User Updated successfully',
          duration: 3000
        })
        await this.$apollo.queries.users.refetch()
        this.closeUpdateForm()
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error?.message || 'Something went wrong',
          action: () => this.updateUser()
        })
      } finally {
        this.loading = false
        this.loadingText = 'Loading'
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: '' })
  },
  apollo: {
    users: {
      query: USERS_QUERY,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: 10, displayName: this.search }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
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
