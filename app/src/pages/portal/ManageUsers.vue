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
            <template #md-table-row="{ item }">
              <md-table-row :class="getClass(item)" md-selectable="multiple">
                <md-table-cell md-label="Firstname" md-sort-by="givenName">{{ item.givenName }}</md-table-cell>
                <md-table-cell md-label="Lastname" md-sort-by="surName">{{ item.surName }}</md-table-cell>
                <md-table-cell md-label="Display name" md-sort-by="displayName">{{ item.displayName }}</md-table-cell>
                <md-table-cell md-label="Email" md-sort-by="email">{{ item.email }}</md-table-cell>
              </md-table-row>
            </template>
          </md-table>
          <pagination :cpage="pageNumber || 1" :tpages="users.totalPages || 1"
            @go-to-page="loadPrevNextUsers($event)" />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { USERS_QUERY, DELETE_USERS_QUERY, UPDATE_USER_QUERY } from '@/modules/gql/user-gql'
import { useOptionalChaining } from '@/composables/useOptionalChaining'
import pagination from '@/components/explorer/Pagination'
import dialogBox from '@/components/Dialog.vue'
import Spinner from '@/components/Spinner'

// Component name for debugging
defineOptions({
  name: 'ManageUser'
})

// Interfaces
interface User {
  _id: string
  alias?: string
  givenName: string
  surName: string
  displayName: string
  email: string
  apiAccess?: boolean
  roles: string
}

interface UsersData {
  totalItems?: number
  pageSize?: number
  pageNumber?: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
  data: User[]
}

interface UsersQueryResult {
  users: UsersData
}

interface DeleteUsersInput {
  input: {
    ids: string[]
  }
}

interface UpdateUserInput {
  input: {
    _id: string
    givenName: string
    surName: string
    roles: string
  }
}

// Store
const store = useStore()

// Composables
const { optionalChaining } = useOptionalChaining()

// Reactive data
const loading = ref(false)
const loadingText = ref('Loading')
const pageNumber = ref(1)
const selected = ref<User[]>([])
const selectedUser = ref<Partial<User>>({})
const updateMode = ref(false)
const search = ref<string | null>(null)
const searched = ref<User[]>([])
const users = ref<UsersData>({ data: [] })

// Computed properties
const dialogBoxActive = computed(() => store.getters.dialogBox)
const userId = computed(() => store.getters['auth/userId'])

const tableData = computed({
  get() {
    return search.value ? searched.value : users.value.data
  },
  set(val: User[]) {
    return val
  }
})

// GraphQL queries and mutations
const {
  result: usersResult,
  loading: usersLoading,
  refetch: refetchUsers,
  onError: onUsersError
} = useQuery<UsersQueryResult>(
  USERS_QUERY,
  () => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: 10,
      displayName: search.value
    }
  }),
  () => ({
    fetchPolicy: 'cache-and-network'
  })
)

const { mutate: deleteUsersMutation } = useMutation(DELETE_USERS_QUERY)
const { mutate: updateUserMutation } = useMutation(UPDATE_USER_QUERY)

// Watch for query results
watch(usersResult, (newResult) => {
  if (newResult?.users) {
    users.value = newResult.users
  }
})

// Handle GraphQL errors
onUsersError((error) => {
  if (error.networkError) {
    const err = error.networkError as any
    store.commit('setSnackbar', {
      message: `Network Error: ${err?.response?.status} ${err?.response?.statusText}`,
      action: () => refetchUsers()
    })
  } else if (error.graphQLErrors) {
    store.commit('setSnackbar', {
      message: error.graphQLErrors,
      action: () => refetchUsers()
    })
  }
})

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox')
}

const openDialogBox = () => {
  toggleDialogBox()
}

const closeDialogBox = () => {
  toggleDialogBox()
}

const showUpdateForm = () => {
  updateMode.value = true
  selectedUser.value = { ...selected.value[0] }
}

const closeUpdateForm = () => {
  updateMode.value = false
  selectedUser.value = {}
  selected.value = []
}

const getClass = ({ _id }: User) => {
  return _id === (selected.value as any)?._id ? 'u--bg' : ''
}

const getAlternateLabel = (count: number) => {
  let plural = ''
  if (count > 1) {
    plural = 's'
  }
  return `${count} user${plural} selected`
}

const searchOnTable = async () => {
  pageNumber.value = 1
  await refetchUsers()
  searched.value = users.value.data
}

const onSelect = (items: User[]) => {
  selected.value = items
}

const loadPrevNextUsers = async (event: number) => {
  pageNumber.value = event
  await refetchUsers()
}

const deleteUsers = async () => {
  const id: string[] = []
  for (let i = 0; i < selected.value.length; i++) {
    id.push(selected.value[i]._id)
  }
  if (id.includes(userId.value)) {
    store.commit('setSnackbar', {
      message: "Can't Delete Current User",
      duration: 3000
    })
    return
  }
  loading.value = true
  try {
    await deleteUsersMutation({
      input: {
        ids: id
      }
    } as DeleteUsersInput)
    store.commit('setSnackbar', {
      message: 'Users deleted successfully',
      duration: 3000
    })
    await refetchUsers()
    closeDialogBox()
  } catch (error: any) {
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => deleteUsers()
    })
  } finally {
    loading.value = false
  }
}

const updateUser = async () => {
  const data = selectedUser.value
  if (!Object.keys(data).length) return

  if (userId.value === data._id && data.roles === 'member') {
    store.commit('setSnackbar', {
      message: 'Unable To Modify Current Role',
      duration: 3000
    })
    return
  }

  loading.value = true
  loadingText.value = 'Updating User'

  try {
    await updateUserMutation({
      input: {
        _id: data._id,
        givenName: data.givenName,
        surName: data.surName,
        roles: data.roles
      }
    } as UpdateUserInput)
    store.commit('setSnackbar', {
      message: 'User Updated successfully',
      duration: 3000
    })
    await refetchUsers()
    closeUpdateForm()
  } catch (error: any) {
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => updateUser()
    })
  } finally {
    loading.value = false
    loadingText.value = 'Loading'
  }
}

// Lifecycle hooks
onMounted(() => {
  store.commit('setAppHeaderInfo', { icon: '', name: '' })
})
</script>
