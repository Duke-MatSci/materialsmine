<template>
  <div class="countdown-page">
    <div class="section_banner">
      <div class="editImage_modal">
        <div class="metamine_intro-content">
          <p class="search_box_header u_centralize_text u_color_white u_margin-top-small">We Are Coming Very Soon!</p>
          <br>
          <div class="header-logo u--margin-none u_margin-top-med">
            <span class="md-title"><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"></span>
          </div>

          <div class="md-layout md-alignment-center-center visualize_accordion u_margin-top-med">
            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{days}}</h1>
              <p class="u_centralize_text p_mobile_small">DAYS</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text">{{hours}}</h1>
              <p class="u_centralize_text p_mobile_small">HOURS</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text ">{{minutes}}</h1>
              <p class="u_centralize_text p_mobile_small">MINUTES</p>
            </div>

            <div class="clock__box u_margin-right-small">
              <h1 class="visualize_header-h1 article_title u_centralize_text ">{{seconds}}</h1>
              <p class="u_centralize_text p_mobile_small">SECONDS</p>
            </div>
          </div>
          <p class="u_color_white u--margin-toplg">Notify me when it's ready</p>

          <form class="form" @submit.prevent="onSubmit">
            <div class="search_box_form">
                <div class="form__group search_box_form-item-1">
                    <input v-model="email" type="email" placeholder="Get notified by email." class="form__input form__input--adjust" name="email" id="search" required />
                    <label htmlFor="email" class="form__label search_box_form_label">Search</label>
                </div>
                <div class="form__group search_box_form-item-2">
                    <button type="submit" class="btn btn--primary btn--tertiary btn--noradius search_box_form_btn submit_button">Submit</button>
                </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CONTACT_US_QUERY } from '@/modules/gql/contact-gql'
export default {
  name: 'CountDown',
  data () {
    return {
      email: '',
      days: '--',
      hours: '--',
      minutes: '--',
      seconds: '--',
      x: null
    }
  },
  computed: {
    countDownDate () {
      return this.$store.getters.countDownDate
    }
  },
  methods: {
    getDate () {
      // Update the count down every 1 second
      this.x = setInterval(() => this.countDown(this.countDownDate), 1000)
    },
    countDown (element) {
      // Get today's date and time
      const now = new Date().getTime()
      const distance = element - now
      // Time calculations for days, hours, minutes and seconds
      this.days = Math.floor(distance / (1000 * 60 * 60 * 24))
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000)
      // If the count down is finished
      if (distance < 0) {
        clearInterval(this.x)
      }
    },
    onSubmit: async function () {
      if (!this.email) return
      try {
        await this.$apollo.mutate({
          mutation: CONTACT_US_QUERY,
          variables: {
            input: {
              fullName: this.email.split('@')[0],
              email: this.email,
              purpose: 'TICKET',
              message: 'Please notify me when the site is ready'
            }
          }
        })
        this.$store.commit('setSnackbar', {
          message: 'Submission Successful',
          duration: 2000
        })
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.onSubmit()
        })
      }
    }
  },
  mounted () {
    this.getDate()
  }
}
</script>
