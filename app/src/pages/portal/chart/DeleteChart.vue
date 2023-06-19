<template>
  <div class="">
    <div v-if="loading" class="section_loader">
      <spinner :loading="true" :text="loadingMessage" />
    </div>

    <div v-else class="">
      <div class=" viz-u-mgup-sm utility-margin md-theme-default">
        <div class="md-card-header contactus_radios md-card-header-flex">
          <div class="md-card-header-text">
            <div class="md-body-1">This task requires super admin priviledges, deploying unapproved changes will require a rollback</div>
          </div>
        </div>

        <md-divider class="u_margin-top-small"></md-divider>
      </div>
    </div>
  </div>
</template>

<script>
import Spinner from '@/components/Spinner'
export default {
  name: 'Deploy',
  components: {
    Spinner
  },
  data () {
    return {
      loading: false,
      loadingMessage: ''
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'Delete Charts' })
  }
}
</script>
