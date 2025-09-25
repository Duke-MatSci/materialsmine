<template>
  <search-gallery
    :isEmpty="isEmpty"
    :totalItems="xmlFinder.totalItems || 0"
    :loading="$apollo.loading"
    :error="!!error"
  >
    <template #search_input>
      <input
        type="text"
        ref="search_input"
        class="form__input form__input--flat"
        placeholder="Search XML"
        name="search"
        id="search"
        required
        v-model="searchWord"
      />
    </template>

    <template #filter_inputs>
      <div
        v-if="selectedFilters.includes('apprStatus')"
        class="u--margin-rightsm"
      >
        <md-chip
          class="u--bg u_margin-bottom-small"
          md-deletable
          @md-delete="removeChip('apprStatus')"
        >
          Admin Approval Status: {{ apprStatus }}</md-chip
        >
      </div>

      <div
        v-if="selectedFilters.includes('curationState')"
        class="u--margin-rightsm"
      >
        <md-chip
          class="u--bg u_margin-bottom-small"
          @md-delete="removeChip('curationState')"
          md-deletable
          >Curation State: {{ curationState }}</md-chip
        >
      </div>

      <div v-if="selectedFilters.includes('isNew')" class="u--margin-rightsm">
        <md-chip
          class="u--bg u_margin-bottom-small"
          @md-delete="removeChip('isNew')"
          md-deletable=""
          >is New: {{ isNew }}</md-chip
        >
      </div>

      <md-field v-if="selectedFilters.includes('user')" style="max-width: 100%">
        <label>Curating User</label>
        <md-input v-model="user"></md-input>
      </md-field>
      <md-field
        v-if="selectedFilters.includes('author')"
        style="max-width: 100%"
      >
        <label>Author</label>
        <md-input v-model="author"></md-input>
      </md-field>
    </template>

    <template #action_buttons>
      <div class="form__field md-field">
        <select
          @change="(e) => selectFilters(e)"
          class="form__select"
          name="filterBy"
          id="filterBy"
        >
          <option value="" disabled selected>Filter by...</option>
          <option value="apprStatus::Approved">
            Admin Approval Status (Approved)
          </option>
          <option value="apprStatus::Not_Approved">
            Admin Approval Status (Not_Approved)
          </option>
          <option value="curationState::Edit">Editing State</option>
          <option value="curationState::Review">Reviewing State</option>
          <option value="curationState::Curated">Curated</option>
          <option value="author">Author</option>
          <option value="user">Curating User</option>
          <option value="isNew::Yes">New curation</option>
          <option value="isNew::No">Old Curation</option>
        </select>
      </div>
      <button
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="submitSearch"
      >
        Search Xml
      </button>
      <button
        v-if="searchEnabled"
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="customReset('XML')"
      >
        Clear Search
      </button>
    </template>

    <template #page_input>
      <input
        type="number"
        id="pagesize"
        class="u_width--xs utility-navfont"
        name="pagesize"
        v-model.lazy="pageSize"
        min="1"
        max="20"
      />
    </template>

    <template
      v-if="
        !!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length && !error
      "
    >
      <md-card
        v-for="(xml, index) in xmlFinder.xmlData"
        :key="index"
        class="btn--animated gallery-item"
      >
        <div class="u_gridicon">
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="editCuration(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Edit Curation</md-tooltip>
            <md-icon>edit</md-icon>
          </div>
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="duplicateCuration(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Duplicate Curation</md-tooltip>
            <md-icon>content_copy</md-icon>
          </div>
          <div
            v-if="isAuthorized(xml.user)"
            @click.prevent="openDialogBox(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Delete Curation</md-tooltip>
            <md-icon>delete</md-icon>
          </div>
        </div>
        <router-link
          :to="{
            name: 'XmlVisualizer',
            params: { id: xml.id },
            query: { isNewCuration: xml.isNewCuration }
          }"
        >
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3">
              <md-icon class="explorer_page-nav-card_icon u_margin-top-small"
                >code_off</md-icon
              >
            </md-card-media>
            <md-card-area class="u_gridbg">
              <md-card-header class="u_show_hide">
                <span class="md-subheading">
                  <strong>{{ xml.title || xml.id || '' }}</strong>
                </span>
                <span class="md-body-1">Click to view</span>
              </md-card-header>
            </md-card-area>
          </md-card-media-cover>
        </router-link>
      </md-card>
    </template>

    <!-- Dialog Box -->
    <dialog-box v-if="dialogBoxActive" :minWidth="40" :active="dialogBoxActive">
      <template v-slot:title>Delete Curation</template>
      <template v-slot:content
        >Are you sure? This action would permanently remove this curation from
        our server.</template
      >
      <template v-slot:actions>
        <md-button @click.native.prevent="closeDialogBox">Cancel</md-button>
        <md-button @click.native.prevent="confirmAction">Delete</md-button>
      </template>
    </dialog-box>

    <template #pagination>
      <pagination
        v-if="xmlFinder && xmlFinder.xmlData"
        :cpage="pageNumber"
        :tpages="xmlFinder.totalPages || 1"
        @go-to-page="loadPrevNextImage($event)"
      />
    </template>

    <template #errorMessage>{{
      !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found'
    }}</template>
  </search-gallery>
</template>

<script>
import pagination from '@/components/explorer/Pagination'
import { XML_FINDER } from '../../../modules/gql/xml-gql'
import explorerQueryParams from '@/mixins/explorerQueryParams'
import SearchGallery from '@/components/XmlSearchUtil'
import { mapGetters, mapMutations } from 'vuex'
import dialogBox from '@/components/Dialog.vue'

export default {
  name: 'XmlGallery',
  data () {
    return {
      baseUrl: window.location.origin,
      renderText: 'Showing all XML',
      xmlFinder: [],
      pageNumber: 1,
      pageSize: 20,
      searchEnabled: false,
      searchWord: '',
      selectedFilters: [],
      apprStatus: null,
      curationState: null,
      user: null,
      author: null,
      isNew: null,
      filterParams: {},
      error: null,
      dialogBoxAction: null
    }
  },
  mixins: [explorerQueryParams],
  components: {
    SearchGallery,
    pagination,
    dialogBox
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      userId: 'auth/userId',
      dialogBoxActive: 'dialogBox'
    }),
    isEmpty () {
      if (
        this.xmlFinder.length === 0 ||
        !Object.keys(this.xmlFinder).length ||
        this.xmlFinder.totalItems === 0
      ) {
        return true
      }
      return false
    },
    filtersActive () {
      return (
        !!this.apprStatus ||
        !!this.curationState ||
        !!this.user ||
        !!this.isNew ||
        !!this.author
      )
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    closeDialogBox () {
      if (this.dialogBoxActive) {
        this.toggleDialogBox()
      }
      this.dialogBoxAction = null
    },
    openDialogBox (id, isNew, func = null) {
      if (!id) return
      this.dialogBoxAction = !func
        ? () => this.deleteXmlCuration(id, isNew)
        : func
      if (!this.dialogBoxActive) {
        this.toggleDialogBox()
      }
    },
    confirmAction () {
      if (this.dialogBoxAction) {
        this.dialogBoxAction()
        this.closeDialogBox()
      }
    },
    isAuthorized (xmlUser) {
      return this.isAuth && (xmlUser === this.userId || this.isAdmin)
    },
    async localSearchMethod () {
      // TODO @aswallace: Update to user query params instead
      const filterParams = {
        isNewCuration: this.selectedFilters.includes('isNew')
          ? this.isNew === 'Yes'
          : null,
        status: this?.apprStatus,
        curationState: this?.curationState,
        user: this?.user,
        author: this?.author
      }
      for (const key in filterParams) {
        if (filterParams[key] === null) delete filterParams[key]
      }
      this.filterParams = filterParams
      await this.$apollo.queries.xmlFinder.refetch()
    },
    async submitSearch () {
      if (!this.searchWord && !this.filtersActive) {
        return this.$store.commit('setSnackbar', {
          message: 'Enter a XML sample file name or select a filter type',
          duration: 10000
        })
      }
      this.error = null
      this.searchEnabled = !!this.searchWord || !!this.filtersActive
      this.pageNumber = 1
      return await this.updateParamsAndCall(true)
    },
    async customReset (type) {
      this.apprStatus = null
      this.curationState = null
      this.user = null
      this.isNew = null
      this.author = null
      this.selectedFilters = []
      this.filterParams = {}
      this.error = null
      await this.resetSearch(type)
    },
    editCuration (id, isNew) {
      this.$router.push({
        name: 'EditXmlCuration',
        query: { isNew, id }
      })
    },
    selectFilters (e) {
      const value = e.target.value
      const arrValue = value.split('::')
      if (!this.selectedFilters.includes(arrValue[0])) {
        this.selectedFilters.push(arrValue[0])
      }
      this[arrValue[0]] = arrValue[1] && arrValue[1]
      e.target.value = ''
    },
    removeChip (str) {
      const index = this.selectedFilters.indexOf(str)
      if (index < 0) return
      this.selectedFilters.splice(index, 1) // 2nd parameter means remove one item only
      this[str] = null
    },
    async deleteXmlCuration (id, isNew = null) {
      if (id && isNew !== null) {
        await this.$store.dispatch('explorer/curation/deleteCuration', {
          xmlId: id,
          isNew: isNew
        })
        return await this.$apollo.queries.xmlFinder.refetch()
      }
    },
    async duplicateCuration (id, isNew) {
      const response = await this.$store.dispatch('explorer/duplicateXml', {
        id,
        isNew
      })
      if (response?.id) {
        this.editCuration(response.id, response.isNew)
      }
    }
  },
  created () {
    const query = this.$route.query
    if (query?.page || query?.size || query?.q) {
      return this.loadParams(this.$route.query)
    }
  },
  apollo: {
    xmlFinder: {
      query: XML_FINDER,
      variables () {
        return {
          input: {
            pageNumber: this.pageNumber,
            pageSize: parseInt(this.pageSize),
            filter: { param: this.$route.query?.q, ...this.filterParams }
          }
        }
      },
      fetchPolicy: 'cache-first',
      result ({ data, loading }) {
        if (!loading && data) this.error = null
      },
      error (error) {
        if (error.networkError) {
          const err = error.networkError
          this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`
        } else if (error.graphQLErrors) {
          this.error = error.graphQLErrors
        }
        this.$store.commit('setSnackbar', {
          message: this.error,
          duration: 10000
        })
      }
    }
  }
}
</script>
