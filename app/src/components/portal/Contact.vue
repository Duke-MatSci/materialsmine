<template>
  <div class="">
    <div
      class="btn--animated u_myprofile md-elevation-2 gallery-item results_card"
      v-if="contact && !!Object.keys(contact).length"
    >
      <div class="md-card-actions viz-u-display__show">
        <div
          class="contact__box-email results_card-title md-body-2 u--color-black utility-roverflow"
        >
          {{ contact.email }}
        </div>
        <div class="md-layout">
          <div class="utility-line-height-sm teams_header">
            <p class="md-body-1 u--color-secondary">{{ shortMessage }}</p>
          </div>
        </div>

        <md-dialog-actions class="u--padding-zero">
          <button
            class="btn btn--white md-body-1 u--shadow-none btn--noradius"
            @click.prevent="displayInquiry"
          >
            Read
          </button>
        </md-dialog-actions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useReduce } from '@/composables';

interface Contact {
  email: string;
  message: string;
  [key: string]: any;
}

const props = defineProps<{
  contact: Contact;
}>();

const store = useStore();
const { reduceDescription } = useReduce();

const shortMessage = computed(() =>
  reduceDescription(props.contact.message, 3)
);

const displayInquiry = () => {
  store.commit('contact/setDisplayedInquiry', props.contact);
};
</script>
