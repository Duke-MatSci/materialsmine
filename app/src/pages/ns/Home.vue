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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import SearchComponent from '@/components/ns/home/SearchComponent.vue'
import OntologyDetails from '@/components/ns/home/OntologyDetails.vue'
import OntologyMetrics from '@/components/ns/home/OntologyMetrics.vue'

const route = useRoute()
const store = useStore()

const loading = ref(false)
const errorMessage = ref("The class information you are looking for doesn't exist.")

const namespace = computed(() => route.params?.namespace)
const containerSize = computed(() => 'md-layout-item md-size-100 md-large-size-95 md-small-size-100 u_height--auto')
const error = computed(() => store.getters['ns/checkError'])

const handleDropdown = () => {
  const element = document.getElementById('searchMenuDropdown')
  if (!element) return
  store.commit('ns/clearSearchQueries')
}

onMounted(() => {
  store.commit('ns/clearSearchQueries')
})
</script>
