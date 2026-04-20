<template>
  <div class="countdown-page">
    <div class="section_banner">
      <div class="editImage_modal">
        <div class="metamine_intro-content">
          <p class="search_box_header u_centralize_text u_color_white u_margin-top-small">
            We Are Coming Very Soon!
          </p>
          <br />
          <div class="header-logo u--margin-none u_margin-top-med">
            <span class="md-title"
              ><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"
            /></span>
          </div>

          <div class="md-layout md-alignment-center-center visualize_accordion u_margin-top-med">
            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{ days }}</h1>
              <p class="u_centralize_text p_mobile_small">DAYS</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{ hours }}</h1>
              <p class="u_centralize_text p_mobile_small">HOURS</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{ minutes }}</h1>
              <p class="u_centralize_text p_mobile_small">MINUTES</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{ seconds }}</h1>
              <p class="u_centralize_text p_mobile_small">SECONDS</p>
            </div>
          </div>
          <p class="u_color_white u--margin-toplg">Notify me when it's ready</p>

          <form class="form" @submit.prevent="onSubmit">
            <div class="search_box_form">
              <div class="form__group search_box_form-item-1">
                <input
                  v-model="email"
                  type="email"
                  placeholder="Get notified by email."
                  class="form__input form__input--adjust"
                  name="email"
                  id="search"
                  required
                />
                <label htmlFor="email" class="form__label search_box_form_label">Search</label>
              </div>
              <div class="form__group search_box_form-item-2">
                <button
                  type="submit"
                  class="btn btn--primary btn--tertiary btn--noradius search_box_form_btn submit_button"
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useMutation } from '@vue/apollo-composable';
import { CONTACT_US_QUERY } from '@/modules/gql/contact-gql';

const store = useStore();

// Apollo mutations
const { mutate: submitContact } = useMutation(CONTACT_US_QUERY);

const email = ref('');
const days = ref('--');
const hours = ref('--');
const minutes = ref('--');
const seconds = ref('--');
let x: any | null = null;

const countDownDate = computed(() => store.getters.countDownDate);

const getDate = () => {
  // Update the count down every 1 second
  x = setInterval(() => countDown(countDownDate.value), 1000);
};

const countDown = (element: number) => {
  // Get today's date and time
  const now = new Date().getTime();
  const distance = element - now;
  // Time calculations for days, hours, minutes and seconds
  days.value = Math.floor(distance / (1000 * 60 * 60 * 24)).toString();
  hours.value = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
  minutes.value = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
  seconds.value = Math.floor((distance % (1000 * 60)) / 1000).toString();
  // If the count down is finished
  if (distance < 0) {
    if (x) clearInterval(x);
  }
};

const onSubmit = async () => {
  if (!email.value) return;
  try {
    await submitContact({
      input: {
        fullName: email.value.split('@')[0],
        email: email.value,
        purpose: 'TICKET',
        message: 'Please notify me when the site is ready',
      },
    });
    store.commit('setSnackbar', {
      message: 'Submission Successful',
      duration: 2000,
    });
  } catch (error) {
    store.commit('setSnackbar', {
      message: 'Something went wrong',
      action: () => onSubmit(),
    });
  }
};

onMounted(() => {
  getDate();
});

onBeforeUnmount(() => {
  if (x) clearInterval(x);
});

defineOptions({
  name: 'CountDown',
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
