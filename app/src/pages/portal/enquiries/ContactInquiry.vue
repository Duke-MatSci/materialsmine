<template>
  <div>
    <Dialog :active="dialogBoxActive" :minWidth="80">
      <template v-slot:title>Reply Inquiry</template>
      <template v-slot:content>
        <div>
          <TextEditor :contentEditable=contentEditable value="message" v-model="message" />
        </div>
      </template>
      <template v-slot:actions>
        <button class="md-button btn btn--primary btn--noradius" @click="send(false)" :disabled="!contentEditable">
          SEND
        </button>
        <button class="md-button btn btn--tertiary btn--noradius" @click="send(true)" :disabled="!contentEditable">
          SEND AND RESOLVE
        </button>
      </template>
    </Dialog>

    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-subhead">This panel allows you to access contact inquiries list, mail response to unresolved
            inquiries and resolve open issues.</div>
        </div>
      </div>
      <md-divider class="u_margin-top-small"></md-divider>
    </div>

    <div class="" v-if="loading">
      <Spinner :loading="loading" :text="'Loading Contact Inquiry'" />
    </div>
    <div class="utility-roverflow" v-else>
      <template v-if="!!contactInquiries.length">
        <ContactCard v-if="!!singleInquiry" :contact="singleInquiry" @replyMessage="renderDialog($event)" />

        <div v-else class="gallery-grid grid grid_col-3 ">
          <ContactBox v-for="(message, i) in contactInquiries" :key="i" :contact="message" />
        </div>

      </template>
      <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
        <h1 class="visualize_header-h1">No Available Inquiries!!!</h1>
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
import TextEditor from '@/components/TextEditor'
import Dialog from '@/components/Dialog.vue'
export default {
  name: 'ContactInquiry',
  data() {
    return {
      showResolved: false,
      pageSize: 10
    }
  },
  components: {
    Spinner,
    pagination,
    ContactBox,
    ContactCard,
    TextEditor,
    Dialog
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      loading: 'contact/getIsLoading',
      pageNumber: 'contact/getPageNumber',
      totalPages: 'contact/getTotalPages',
      contactInquiries: 'contact/getContactInquiries',
      singleInquiry: 'contact/getSingleInquiry',
      contentEditable: 'contact/getContentEditable'
    }),
    message: {
      get() {
        return this.$store.getters['contact/getMessage']
      },
      set(payload) {
        this.$store.commit('contact/setMessage', payload)
      }
    }
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
    this.$store.commit('setAppHeaderInfo', { icon: 'mail', name: 'Contact Inquiries' })
  },
  mounted() {
    this.loadContacts(this.pageNumber)
  }
}
</script>