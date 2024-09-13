<template>
  <div class="md-table md-card-header utility-bg_border-dark u--b-rad">
    <div class="article_subtitle u_margin-bottom-small">Metrics</div>
    <!-- <hr class="md-divider u--bg" /> -->
    <table class="">
      <tbody>
        <tr class="" v-for="(val, key) in metrics" :key="key">
          <td class="u--bg md-table-cell image-detail-page-tab">
            <div class="md-table-cell-container">
              {{ key }}
            </div>
          </td>

          <td class="md-table-cell md-numeric image-detail-page-tab">
            <div class="md-table-cell-container">
              {{ val }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'OntologyMetrics',
  computed: {
    ...mapGetters({
      metrics: 'ns/getMetrics',
      loading: 'ns/getLoading'
    })
  }
}
</script>
