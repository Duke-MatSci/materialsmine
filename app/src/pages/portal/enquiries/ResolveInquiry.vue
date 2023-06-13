<template>
  <div>
    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-subhead">This panel allows you to view resolved contact inquiries, and keeps record of closed
            issues.</div>
        </div>
      </div>
      <md-divider class="u_margin-top-small"></md-divider>
    </div>
    <div class="" v-if="loading">
      <Spinner :loading="loading" :text="'Loading Resolved Inquiry'" />
    </div>
    <div class="utility-roverflow" v-else>
      <template v-if="!!contactInquiries.length">
        <ContactCard v-if="!!singleInquiry" :contact="singleInquiry" />

        <div v-else class="gallery-grid grid grid_col-3 ">
          <ContactBox v-for="(message, i) in contactInquiries" :key="i" :contact="message" />
        </div>

      </template>
      <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
        <h1 class="visualize_header-h1">No Resolved Inquiries Available!!!</h1>
      </div>
    </div>
    <pagination :cpage="pageNumber || 0" :tpages="totalPages || 0" @go-to-page="loadContacts($event)" />
  </div>
</template>

<script>
import Spinner from '@/components/Spinner'
import ContactBox from '@/components/portal/Contact.vue'
import ContactCard from '@/components/portal/ContactCard.vue'
import { mapMutations, mapGetters, mapActions } from 'vuex'
import pagination from '@/components/explorer/Pagination'
export default {
  name: 'ContactInquiry',
  data() {
    return {
      showResolved: true,
      pageSize: 10
    }
  },
  components: {
    Spinner,
    pagination,
    ContactCard,
    ContactBox
  },
  computed: {
    ...mapGetters({
      loading: 'contact/getIsLoading',
      pageNumber: 'contact/getPageNumber',
      totalPages: 'contact/getTotalPages',
      contactInquiries: 'contact/getContactInquiries',
      singleInquiry: 'contact/getSingleInquiry'
    })
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    ...mapActions({
      loadItems: 'contact/loadItems',
      send: 'contact/send',
      renderDialog: 'contact/renderDialog'
    }),
    loadContacts(num = 1) {
      const payload = {
        showResolved: this.showResolved,
        page: num,
        pageSize: this.pageSize
      }
      this.loadItems(payload)
    }
  },
  created() {
    this.$store.commit('setAppHeaderInfo', { icon: 'mail', name: 'Resolved Inquiries' })
  },
  mounted() {
    this.loadContacts(this.pageNumber)
  }
}
</script>