<template>
  <div class="section_pages u--margin-centered-verticalScreen">
    <div v-if="!loading" class="wrapper viz-u-maxwidth" @click="handleDropdown">
      <p v-if="error" class="u_centralize_text u--color-error md-body-1">
        {{ errorMessage }}<br />
        Please try again
      </p>
      <SearchComponent :searchError="error" />

      <article class="u--margin-posmd md-layout md-alignment-center-center">
        <hr
          class="md-divider u--bg viz-u-mgbottom-big"
          :class="containerSize"
        />

        <div
          class="md-layout md-gutter u_margin-none"
          :class="containerSize"
          style="gap: 1rem"
        >
          <section
            class="viz-u-maxwidth md-layout-item viz-u-mgbottom-big search_box_form-item-2 u--padding-zero u_height--auto"
          >
            <OntologyDetails />
          </section>
          <section
            class="md-layout-item md-size-100 md-small-size-100 md-large-size-35 md-xlarge-size-35 u--padding-zero u_height--auto"
          >
            <OntologyMetrics />
          </section>
        </div>
      </article>
    </div>
  </div>
</template>
<script>
import SearchComponent from '@/components/ns/home/SearchComponent.vue'
import OntologyDetails from '@/components/ns/home/OntologyDetails.vue'
import OntologyMetrics from '@/components/ns/home/OntologyMetrics.vue'

export default {
  name: 'Namespace',
  components: {
    SearchComponent,
    OntologyDetails,
    OntologyMetrics
  },
  data () {
    return {
      loading: false,
      errorMessage: "The class information you are looking for doesn't exist."
    }
  },
  computed: {
    namespace () {
      return this.$route.params?.namespace
    },
    containerSize () {
      return 'md-layout-item md-size-100 md-large-size-95 md-small-size-100 u_height--auto'
    },
    error () {
      return this.$store.getters['ns/checkError']
    }
  },
  methods: {
    handleDropdown () {
      const element = document.getElementById('searchMenuDropdown')
      if (!element) return
      this.$store.commit('ns/clearSearchQueries')
    }
  },
  mounted () {
    this.$store.commit('ns/clearSearchQueries')
  }
}
</script>
