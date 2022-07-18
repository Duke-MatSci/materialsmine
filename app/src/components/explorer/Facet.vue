<template>
    <div :class="{facet: true, facet_active: searchEnabled}">
        <div class="facet_viewport">
            <md-list>
                <md-subheader class="md-primary facet-header">
                  Filter <md-icon class="u_color_white u_margin-none">filter_alt</md-icon>
                </md-subheader>
                <md-divider></md-divider>

                <!-- IMAGE FILTER START HERE -->
                <div class="facet-content_container" v-if="filterType === 'IMAGE'">
                  <div class="facet-content_label">Filter by filler Info:</div>
                  <input
                    placeholder="Filter by filler"
                    class="form__select facet-content_item"
                    name="filterByFiller"
                    ref="filterByFiller"
                    @change.prevent="updateQuery"
                    title="filter by filler info"
                  >
                  <div class="facet-content_label u_margin-top-small">Filter by keyword:</div>
                  <input
                    placeholder="Filter by keyword"
                    class="form__select facet-content_item"
                    name="filterByKeyword"
                    ref="filterByKeyword"
                    @change.prevent="updateQuery"
                    title="filter by keyword"
                  >
                  <div class="facet-content_label u_margin-top-small">Filter by year:</div>
                  <input
                    placeholder="Filter by year"
                    class="form__select facet-content_item"
                    name="filterByYear"
                    ref="filterByYear"
                    @change.prevent="updateQuery"
                    title="filter by published year"
                  >
                  <div class="utility-color u_margin-top-small" id="css-adjust-navfont">
                    <button class="u--bg form__select facet-content_item" @click.prevent="otherFilters">{{ searchButtonText }}</button>
                  </div>
                </div>

                <!-- DEFAULT FILTER STARTS HERE -->
                <div class="facet-content_container" v-else-if="!filterType && !!facetFilterMaterials.length">
                  <div class="facet-content_label">MaterialsMine Properties:</div>
                  <select
                    class="form__select facet-content_item"
                    name="filtermaterial"
                    @change.prevent="defaultFilter"
                    title="To see how it works, select a property from the drop-down list below."
                  >
                      <option value="">--Please choose a property--</option>
                      <option
                        v-for="(val, index) in facetFilterMaterials"
                        :key="index" :value="val.Label"
                      > {{ val.Label }}</option>
                  </select>
                </div>
            </md-list>
        </div>
    </div>
</template>
<script>
import Facet from '@/modules/facet.js'
export default {
  name: 'FacetPanel',
  props: ['filterType'],
  data () {
    return {
      searchEnabled: true,
      queryObject: { target: { name: '', value: '' } }
    }
  },
  computed: {
    facetFilterMaterials () {
      return this.$store.getters['explorer/getFacetFilterMaterials']
    },
    searchButtonText () {
      return this.queryObject.target.value.length > 0 ? 'Clear' : 'Search'
    }
  },
  mounted () {
    Facet()
  },
  methods: {
    async defaultFilter (arg) {
      const selectedValue = arg.target.value
      await this.$store.dispatch('explorer/searchFacetFilterMaterials', selectedValue)
    },
    updateQuery (event) {
      if (event.target.value.length) {
        this.queryObject = event
      }
    },
    async otherFilters () {
      const { name, value } = this.queryObject.target
      await this.$store.commit('explorer/setSelectedFacetFilterMaterialsValue', { type: name, value })
    }
  }
}
</script>
