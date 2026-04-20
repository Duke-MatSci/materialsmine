<template>
  <div>
    <Dialog :active="dialogBoxActive" :minWidth="80">
      <template v-slot:title>Reply Inquiry</template>
      <template v-slot:content>
        <div>
          <TextEditor :contentEditable="contentEditable" :value="message" />
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
        <ContactCard v-if="!!singleInquiry" :contact="singleInquiry"/>

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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import Spinner from '@/components/Spinner.vue';
import ContactBox from '@/components/portal/Contact.vue';
import ContactCard from '@/components/portal/ContactCard.vue';
import pagination from '@/components/explorer/Pagination.vue';
import TextEditor from '@/components/TextEditor.vue';
import Dialog from '@/components/Dialog.vue';

const store = useStore();

const showResolved = ref(false);
const pageSize = ref(10);

const dialogBoxActive = computed(() => store.getters['dialogBox']);
const loading = computed(() => store.getters['contact/getIsLoading']);
const pageNumber = computed(() => store.getters['contact/getPageNumber']);
const totalPages = computed(() => store.getters['contact/getTotalPages']);
const contactInquiries = computed(() => store.getters['contact/getContactInquiries']);
const singleInquiry = computed(() => store.getters['contact/getSingleInquiry']);
const contentEditable = computed(() => store.getters['contact/getContentEditable']);
const message = computed(() => store.getters['contact/getMessage']);

const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const loadItems = (payload: any) => {
  store.dispatch('contact/loadItems', payload);
};

const send = (resolveInquiry: boolean) => {
  store.dispatch('contact/send', resolveInquiry);
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
  store.commit('setAppHeaderInfo', { icon: 'mail', name: 'Contact Inquiries' });
  loadContacts(pageNumber.value);
});
</script>
