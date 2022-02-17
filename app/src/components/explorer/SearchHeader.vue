<template>
    <div class="explorer_page_header">
        <md-tabs class="btn--primary">
            <md-tab :md-label="'Images (' + images + ')'"> Image Tab </md-tab>
            <md-tab :md-label="'Samples (' + samples + ')'"> Sample Tab </md-tab>
            <md-tab :md-label="'Articles (' + articles + ')'"> Article Tab </md-tab>
            <md-tab :md-label="'Charts (' + charts + ')'"> Chart Tab </md-tab>
            <!-- <md-tab :md-label="'Datasets (' + datasets + ')'"> Dataset Tab </md-tab>
            <md-tab :md-label="'Other (' + other + ')'"> Other Tab </md-tab> -->
        </md-tabs>
    </div>
</template>
<script>
export default {
  name: 'SearchHeader',
  props: ['searchEnabled'],
  computed: {
    images () {
      return 0
    },
    samples () {
      return 0
    },
    articles () {
      return 0
    },
    charts () {
      return 0
    }
    // datasets () {
    //     return 0
    // },
    // other () {
    //     return 0
    // },
  }
}
</script>
