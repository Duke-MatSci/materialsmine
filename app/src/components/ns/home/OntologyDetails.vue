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

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

// Component name for debugging
defineOptions({
  name: 'OntologyDetails',
});

const store = useStore();

// Computed properties
const details = computed(() => store.getters['ns/getDetails']);
const loading = computed(() => store.getters['ns/getLoading']);

const objLength = computed(() => {
  return Object.keys(details.value).length;
});

const sortedKeys = computed(() => {
  return Object.keys(details.value).sort();
});
</script>
