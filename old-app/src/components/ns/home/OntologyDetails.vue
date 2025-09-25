<template>
  <div class="md-table md-card-header utility-bg_border-dark u--b-rad">
    <div class="article_subtitle u_margin-bottom-small">Details</div>
    <!-- <hr class="md-divider u--bg-grey" /> -->
    <table class="u_width--max">
      <tbody>
        <tr class="" v-for="(key, i) in sortedKeys" :key="key">
          <td
            class="u--bg md-table-cell teams_partner-nsf"
            :class="[i === objLength - 1 ? 'image-detail-page-tab' : '']"
          >
            <div class="md-table-cell-container">
              {{ key }}
            </div>
          </td>

          <td class="md-table-cell image-detail-page-tab">
            <div class="md-table-cell-container">
              {{ details[key] }}
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
  name: 'OntologyDetails',
  data: () => ({}),
  computed: {
    ...mapGetters({
      details: 'ns/getDetails',
      loading: 'ns/getLoading'
    }),
    objLength () {
      return Object.keys(this.details).length
    },
    sortedKeys () {
      return Object.keys(this.details).sort()
    }
  }
}
</script>
