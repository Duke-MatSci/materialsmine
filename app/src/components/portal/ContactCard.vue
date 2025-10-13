<template>
  <div class="">
    <div
      class="gallery-item results_card"
      v-if="contact && !!Object.keys(contact).length"
    >
      <md-card-header>
        <div
          class="results_card-title md-body-2"
          style="text-transform: capitalize"
        >
          {{ contact.fullName }}
        </div>
        <div v-if="show" class="md-layout md-alignment-center-space-between">
          <div class="results_card-type">{{ contact.email }}</div>
          <div class="results_card-type">PURPOSE: {{ contact.purpose }}</div>
        </div>
        <div class="md-layout">
          <div
            v-if="!show"
            class="howto_item u--color-secondary utility-line-height-sm teams_header"
          >
            <p class="teams_header">{{ shortMessage }}</p>
          </div>
          <div
            v-else
            class="article_metadata u--color-secondary utility-line-height-sm"
          >
            {{ contact.message }}
          </div>
        </div>
        <div
          v-if="show && hasAttachment"
          class="md-layout md-alignment-center-space-between"
        >
          <p class="md-body-2">{{ reducedName }}.....</p>

          <md-button
            class="md-icon-button"
            @click="downloadImage(contact.attachments[0])"
          >
            <md-icon>download</md-icon>
            <md-tooltip md-direction="top">Click to download file</md-tooltip>
          </md-button>
        </div>

        <div class="" v-if="show && contact.resolved">
          <p class="md-body-2 u--color-grey-sec">Response</p>
          <md-divider class=""></md-divider>
          <div class="results_card-title md-body-2 u_margin-top-small">
            Resolved by: <span class="md-body-1">{{ contact.resolvedBy }}</span>
          </div>
          <div class="results_card-title md-body-2 u_margin-top-small">
            Message
          </div>
          <div class="md-layout">
            <div class="results_card results_card-type">
              <span v-html="parseMessage"></span>
            </div>
          </div>
        </div>

        <div class="dialog-box_actions">
          <md-dialog-actions>
            <button
              v-if="!show"
              class="md-button btn btn--primary btn--noradius"
              @click="show = true"
            >
              SHOW
            </button>
            <button
              v-else
              class="md-button btn btn--primary btn--noradius"
              @click.prevent="hideInquiry"
            >
              HIDE
            </button>
            <button
              v-if="!contact.resolved"
              class="md-button btn btn--tertiary btn--noradius"
              @click.prevent="handleRenderDialog(contact._id)"
            >
              Reply
            </button>
          </md-dialog-actions>
        </div>
      </md-card-header>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useReduce } from '@/composables';

interface Contact {
  email: string;
  message: string;
  fullName: string;
  purpose: string;
  attachments?: string[];
  resolved?: boolean;
  resolvedBy?: string;
  response?: string;
  _id: string;
  [key: string]: any;
}

const props = defineProps<{
  contact: Contact;
}>();

const store = useStore();
const { reduceDescription } = useReduce();
const show = ref(true);

const shortMessage = computed(() =>
  reduceDescription(props.contact.message, 15)
);

const parseMessage = computed(() => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(props.contact.response || '', 'text/html');
  return (
    doc.getElementById('mainMessage')?.innerHTML ?? props.contact.response
  );
});

const reducedName = computed(() => {
  const fileLink = props.contact.attachments?.[0] || '';
  const arr = fileLink.split('/');
  return arr.length > 3 ? arr[3].substring(0, 40) : fileLink;
});

const hasAttachment = computed(() => {
  return props.contact?.attachments && props.contact?.attachments?.length;
});

const hideInquiry = () => {
  store.commit('contact/setDisplayedInquiry', null);
};

const handleRenderDialog = (id: string) => {
  store.dispatch('contact/renderDialog', id);
};

const downloadImage = async (arg: string) => {
  const baseUrl = window.location.origin;
  const fileUrl = `${baseUrl}${arg}`;
  const encodedUrl = encodeURI(fileUrl);
  const fileLink = document.createElement('a');
  fileLink.href = encodedUrl;
  const name = arg?.split('?')[0];
  fileLink.setAttribute('download', name);
  document.body.appendChild(fileLink);
  fileLink.click();
};
</script>
