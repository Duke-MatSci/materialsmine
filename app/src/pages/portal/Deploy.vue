<template>
  <div>
    <div class="">
      <dialog-box :minWidth="40" :active="dialogBoxActive">
        <template v-slot:title>Alert</template>
        <template v-slot:content
          >You are about to shut down the server and rebuild, are you
          sure?</template
        >
        <template v-slot:actions>
          <md-button @click.prevent="shutDown">Yes</md-button>
          <md-button @click.prevent="closeDialogBox">No</md-button>
        </template>
      </dialog-box>
      <div v-if="loading" class="section_loader">
        <spinner :loading="true" :text="loadingMessage" />
      </div>

      <div v-else class="">
        <div class="viz-u-mgup-sm utility-margin md-theme-default">
          <div class="md-card-header contactus_radios md-card-header-flex">
            <div class="md-card-header-text">
              <div class="md-body-1">
                This task requires super admin priviledges, deploying unapproved
                changes will require a rollback
              </div>
            </div>
          </div>
          <div class="md-card-actions md-alignment-right">
            <button
              @click.prevent="toggleDialogBox"
              class="md-button btn btn--tertiary btn--noradius"
            >
              Pull and Deploy Latest Changes
            </button>
          </div>
          <md-divider class="u_margin-top-small"></md-divider>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import dialogBox from '@/components/Dialog.vue';
import Spinner from '@/components/Spinner.vue';

const store = useStore();
const loading = ref(false);
const dialogTitle = ref('Ready');
const dialogContent = ref('Some Text');
const loadingMessage = ref('');
const headerText = ref(false);

const dialogBoxActive = computed(() => store.getters['dialogBox']);
const token = computed(() => store.getters['auth/token']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);

const toggleDialogBox = () => {
  store.commit('setDialogBox');
};

const closeDialogBox = () => {
  if (dialogBoxActive.value) {
    toggleDialogBox();
  }
};

const startProcess = () => {
  closeDialogBox();
  startLoading();
  setTimeout(() => shutDownMessage(), 120000);
  setTimeout(() => loadMessage(), 180000);
  setTimeout(() => checkServerStatus(), 300000);
};

const endProcess = () => {
  store.commit('setSnackbar', {
    message: 'Deployment Successful',
    duration: 3000,
  });
  loading.value = false;
  headerText.value = true;
};

const startLoading = () => {
  loadingMessage.value = 'Server is shutting down';
  loading.value = true;
};

const shutDownMessage = () => {
  loadingMessage.value = 'Server Shutdown Completed';
};

const loadMessage = () => {
  loadingMessage.value = 'Loading Server';
};

const shutDown = async () => {
  headerText.value = false;
  try {
    const response = await fetch('/api/admin/call-script', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token.value,
      },
    });
    if (!response || response.statusText !== 'OK' || response.status !== 200) {
      const error = new Error(
        (response as any)?.message || 'Something went wrong!'
      );
      throw error;
    }
    const responseData = await response.json();
    if (response.status === 200 && responseData.message === 'Successful') {
      startProcess();
    }
  } catch (error) {
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => shutDown(),
    });
    closeDialogBox();
  }
};

const checkServerStatus = async () => {
  try {
    const response = await fetch('/api/admin/confirm-script-call', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token.value,
      },
    });
    if (!response || response.statusText !== 'OK' || response.status !== 200) {
      const error = new Error(
        (response as any)?.message || 'Something went wrong!'
      );
      throw error;
    }
    const responseData = await response.json();
    if (response.status === 200 && responseData.message === 'Successful') {
      endProcess();
    }
  } catch (error) {
    store.commit('setSnackbar', {
      message: 'Restarting Deployment',
      duration: 3000,
    });
    startProcess();
    closeDialogBox();
  }
};

onMounted(() => {
  store.commit('setAppHeaderInfo', { icon: '', name: 'Deploy' });
});
</script>
