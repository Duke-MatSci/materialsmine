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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import Spinner from '@/components/Spinner.vue';
import ContactBox from '@/components/portal/Contact.vue';
import ContactCard from '@/components/portal/ContactCard.vue';
import pagination from '@/components/explorer/Pagination.vue';

const store = useStore();

const showResolved = ref(true);
const pageSize = ref(10);

const loading = computed(() => store.getters['contact/getIsLoading']);
const pageNumber = computed(() => store.getters['contact/getPageNumber']);
const totalPages = computed(() => store.getters['contact/getTotalPages']);
const contactInquiries = computed(() => store.getters['contact/getContactInquiries']);
const singleInquiry = computed(() => store.getters['contact/getSingleInquiry']);

const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const loadItems = (payload: any) => {
  store.dispatch('contact/loadItems', payload);
};

const send = (resolveInquiry: boolean) => {
  store.dispatch('contact/send', resolveInquiry);
};

const renderDialog = (payload: any) => {
  store.dispatch('contact/renderDialog', payload);
};

const loadContacts = (num = 1) => {
  const payload = {
    showResolved: showResolved.value,
    page: num,
    pageSize: pageSize.value
  };
  loadItems(payload);
};

onMounted(() => {
  store.commit('setAppHeaderInfo', { icon: 'mail', name: 'Resolved Inquiries' });
  loadContacts(pageNumber.value);
});
</script>
