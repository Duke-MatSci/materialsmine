<template>
  <div
    class="section_teams viz-u-mgbottom-big"
    :class="{ 'u--margin-neg': searchError }"
  >
    <div class="md-layout md-gutter md-alignment-top-center u_margin-top-med">
      <div
        class="search_box md-layout-item md-size-70 md-small-size-80 md-xsmall-size-90 u_height--auto"
      >
        <h2 class="search_box_header teams_header">
          MaterialsMine Ontology Explorer
        </h2>
        <p class="u--color-grey-sec u--margin-neg md-body-1">
          <small>Last Updated:- {{ lastUpdate }}</small>
        </p>
        <form class="form" @submit.prevent="submitSearch">
          <div class="search_box_form viz-u-postion__rel">
            <div class="form__group search_box_form-item-1">
              <input
                type="text"
                ref="search_input"
                class="form__input form__input--adjust"
                autocomplete="off"
                placeholder="Search Ontology"
                name="search"
                id="search"
                required
                v-model="searchKeyword"
              />
              <label htmlFor="search" class="form__label search_box_form_label"
                >Search</label
              >
            </div>
            <template v-if="!!searchResult.length">
              <div
                id="searchMenuDropdown"
                class="search-dropdown-menu"
                :style="setDropdownPosition"
              >
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
          <div
            class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg"
          >
            <button
              type="submit"
              class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'SearchComponent',
  props: {
    searchError: {
      type: Boolean,
      default: false
    },
    showDropdown: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      searchKeyword: '',
      searchEnabled: false
    }
  },
  computed: {
    ...mapGetters('ns', {
      classes: 'getClasses',
      searchResult: 'getSearchResults',
      lastUpdate: 'getLastUpdatedDate'
    }),
    setDropdownPosition () {
      return { top: 81 + '%', zIndex: 10, right: 0, minHeight: 'auto' }
    },
    isValidLength () {
      return this.searchKeyword.length > 2
    }
  },
  methods: {
    async submitSearch () {
      const query = this.searchKeyword
      if (query.length < 3) return

      // this.$store.commit('ns/showDropdown', true)
      await this.$store.dispatch('ns/searchNSData', {
        query,
        singleResult: false
      })
    },

    showClassInfo (id) {
      const url = `/ns/${id.split('/').pop()}`
      this.$router.push(url)
    }
  }
}
</script>
