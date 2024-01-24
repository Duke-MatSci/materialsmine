<template>
  <article class="u_width--max">
    <header aria-label="dynamfit-header" class="explorer_page_header">
      <h1 class="visualize_header-h1 u_margin-top-med u_centralize_text">
        DynamFit
      </h1>
    </header>
    <main
      aria-label="dynamfit-main"
      class="u--margin-posmd md-layout md-alignment-top-space-around"
    >
      <!-- aside  -->
      <aside
        aria-label="dynamfit-setting"
        class="md-layout-item md-size-25 md-medium-size-35 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartSetting />
      </aside>
      <!-- main  -->
      <section
        aria-label="dynamfit-data"
        class="md-layout-item md-size-70 md-medium-size-60 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartVisualizer />
      </section>
    </main>
  </article>
</template>

<script>
import ChartSetting from '@/components/explorer/dynamfit/ChartSetting.vue'
import ChartVisualizer from '@/components/explorer/dynamfit/ChartVisualizer.vue'

export default {
  name: 'DynamFit',
  components: {
    ChartSetting,
    ChartVisualizer
  }
}
</script>
