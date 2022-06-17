<template>
    <div :class="{facet: true, facet_active: searchEnabled}">
        <div class="facet_viewport">
            <md-list>
                <md-subheader class="md-primary facet-header">
                  Filter <md-icon class="u_color_white u_margin-none">filter_alt</md-icon>
                </md-subheader>
                <md-divider></md-divider>
                <div class="facet-content_container" v-if="!!facetFilterMaterials.length">
                  <div class="facet-content_label">MaterialsMine Properties:</div>
                  <select
                    class="form__select facet-content_item"
                    name="filtermaterial"
                    @change.prevent="submitFilter"
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
  // props: ['searchEnabled'],
  data () {
    return {
      searchEnabled: true
    }
  },
  computed: {
    facetFilterMaterials () {
      return this.$store.getters['explorer/getFacetFilterMaterials']
    }
  },
  mounted () {
    Facet()
  },
  methods: {
    async submitFilter (arg) {
      const selectedValue = arg.target.value
      await this.$store.dispatch('explorer/searchFacetFilterMaterials', selectedValue)
    }
  }
}
</script>
