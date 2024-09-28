<template>
  <div
    class="u_width--max utility-bg_border-dark md-card-header u--b-rad"
    :class="{ 'utility-roverflow': !isListVisible }"
    :style="!isListVisible ? limitHeight : ''"
  >
    <div class="viz-u-postion__rel">
      <div class="u--layout-flex u--layout-flex-justify-sb u_centralize_items">
        <h1 class="md-subheading"><strong>Classes</strong></h1>
        <button
          type="button"
          data-test="toggle-list"
          @click.prevent="isListVisible = !isListVisible"
          class="md-button md-icon-button md-dense md-theme-default"
        >
          <div class="md-ripple">
            <div class="md-button-content">
              <md-icon class="utility-color">{{
                isListVisible ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
              }}</md-icon>
            </div>
          </div>
        </button>
      </div>
      <md-field style="align-items: baseline">
        <p><strong>Jump to:</strong></p>
        &nbsp;
        <md-input v-model="searchKeyword" id="namespace"></md-input>
        <md-button
          aria-disabled="true"
          disabled
          class="md-icon-button md-dense"
        >
          <md-icon>search</md-icon>
        </md-button>
      </md-field>

      <template v-if="!!searchResult.length">
        <div class="search-dropdown-menu" :style="setDropdownPosition">
          <button
            v-for="(obj, index) in searchResult"
            :key="index"
            @click.prevent="showClassInfo(obj['ID'])"
            style="white-space: wrap"
            class="btn-text md-button-clean viz-u-display__show u_width--max md-card-actions search_box_form_label u_pointer"
          >
            <span>
              <strong>{{ obj['Preferred Name'] }}</strong></span
            >
          </button>
        </div>
      </template>
    </div>

    <NamespaceAccordion
      v-for="obj in classes"
      :key="obj['ID']"
      :id="obj['ID']"
      :summary="obj['Preferred Name']"
      :class-info="obj"
      :child="obj['subClasses']"
    />
  </div>
</template>

<script>
import NamespaceAccordion from '@/components/ns/classes/NamespaceAccordion.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'ClassesList',
  data () {
    return {
      loading: false,
      searchKeyword: '',
      isListVisible: true
    }
  },
  components: {
    NamespaceAccordion
  },
  computed: {
    ...mapGetters({
      classes: 'ns/getClasses',
      currentClass: 'ns/getCurrentClass',
      searchResult: 'ns/getSearchResults'
    }),
    setDropdownPosition () {
      return { top: 100 + '%', zIndex: 10, right: 0, minHeight: 'auto' }
    },

    limitHeight () {
      return { maxHeight: 6 + 'rem' }
    }
  },
  methods: {
    toggleClass (id) {
      const element = document.getElementById(id)
      if (!element) return
      element.classList.toggle('u--alt-bg')
      this.openAncestor(id)
    },
    openAncestor (id) {
      const element = document.getElementById(id)
      let parent = element.parentElement
      while (parent) {
        if (parent.tagName.toLowerCase() === 'details') {
          parent.open = true
        }
        parent = parent.parentElement
      }
    },
    showClassInfo (id) {
      const url = `/ns/${id.split('/').pop().split('#').pop()}`
      this.$router.push(url)
    },
    async submitSearch () {
      const query = this.searchKeyword
      if (query.length < 3) {
        return this.$store.commit('ns/clearSearchQueries')
      }
      await this.$store.dispatch('ns/searchNSData', {
        query,
        singleResult: false
      })
    }
  },
  mounted () {
    this.toggleClass(this.$store.state.ns.selectedId)
  },
  watch: {
    searchKeyword () {
      this.submitSearch()
    }
  }
}
</script>
