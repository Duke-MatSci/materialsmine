<template>
  <div class="section_pages">
    <div class="wrapper">
      <div class="viz-u-mgbottom-big u_margin-top-med">
        <div class="search_box u_margin-top-med">
          <h2
            class="visualize_header-h1 article_title u_centralize_text u_margin-top-med u--color-primary teams_header"
          >
            MaterialsMine Ontology Submissions
          </h2>
        </div>
      </div>

      <div class="md-layout md-gutter md-alignment-top-center u_margin-top-med">
        <div
          class="md-layout-item md-size-60 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
        >
          <TableComponent
            emptyState="No Submission Data Found"
            :tableData="formattedSubmission"
            sortBy="Version"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import TableComponent from '@/components/explorer/TableComponent.vue'

const store = useStore()

const loading = ref(false)

const submissions = computed(() => store.state.ns.submissions)

const formattedSubmission = computed(() => {
  if (!submissions.value?.length) return
  const arr = [...submissions.value]

  const result = arr.map((val: any) => ({
    Version: val?.version,
    '': val?.description,
    Released: formatDate(val?.released),
    Uploaded: formatDate(val?.uploaded)
  }))

  return result
})

const formatDate = (d: string | Date): string => {
  const date = new Date(d)
  return date.toLocaleDateString() // Example output: "DD/MM/YYYY" (format depends on your locale)
}
</script>
